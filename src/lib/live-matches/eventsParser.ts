import type { MatchEventDetail } from '@/hooks/useLiveMatches';

interface ParseEventsOptions {
  competition: any;
  event: any;
  homeRawName: string;
  homeComp: any;
  awayComp: any;
  matchCurrentMinute: number | null;
  isLiveNow: boolean;
  isUpcoming: boolean;
  isFinishedToday: boolean;
  espnHeaders: Record<string, string>;
}

export async function parseMatchEvents({
  competition,
  event,
  homeRawName,
  homeComp,
  awayComp,
  matchCurrentMinute,
  isLiveNow,
  isUpcoming,
  isFinishedToday,
  espnHeaders,
}: ParseEventsOptions): Promise<MatchEventDetail[]> {
  let parsedEvents: MatchEventDetail[] = [];

  // ── 1. Parsear competition.details de ESPN ───────────────────────────────
  if (Array.isArray(competition.details)) {
    for (const d of competition.details) {
      const typeText = (d.type?.text || '').toLowerCase();
      const isOwnGoal = Boolean(d.ownGoal || typeText.includes('own goal') || typeText.includes('autogol'));
      const isPenaltyScored = Boolean(
        (d.penaltyKick && d.scoringPlay) ||
        typeText.includes('penalty - scored') ||
        typeText.includes('penalty scored') ||
        d.type?.id === '98'
      );
      const isPenaltyMissed = Boolean(
        (d.penaltyKick && !d.scoringPlay) ||
        typeText.includes('penalty - missed') ||
        typeText.includes('penalty - saved') ||
        typeText.includes('missed penalty')
      );
      const isDisallowed = Boolean(
        typeText.includes('disallowed') ||
        typeText.includes('anulado') ||
        typeText.includes('overturned') ||
        typeText.includes('cancelled') ||
        typeText.includes('no goal')
      );
      const isVar = Boolean(
        typeText.includes('var') ||
        typeText.includes('video assistant') ||
        isDisallowed
      );
      const isRed = Boolean(d.redCard || typeText.includes('red card') || d.type?.id === '93' || d.type?.id === '95');
      const isYellow = Boolean(d.yellowCard || typeText.includes('yellow card') || d.type?.id === '94');
      const isGoal = Boolean(!isOwnGoal && !isPenaltyScored && !isDisallowed && (d.scoringPlay || typeText.includes('goal') || d.type?.id === '70' || d.type?.id === '137' || d.type?.id === '173'));

      if (!isGoal && !isPenaltyScored && !isPenaltyMissed && !isOwnGoal && !isDisallowed && !isVar && !isRed && !isYellow) {
        continue;
      }

      // Validación de coherencia temporal:
      const eventMinuteStr = d.clock?.displayValue || (d.clock?.value ? `${Math.floor(d.clock.value / 60)}'` : '');
      const eventMinMatch = eventMinuteStr.match(/^(\d+)/);
      const eventMinNum = eventMinMatch ? parseInt(eventMinMatch[1], 10) : null;
      if (isLiveNow && matchCurrentMinute != null && eventMinNum != null) {
        if (eventMinNum > matchCurrentMinute + 2) {
          continue;
        }
      }
      if (isUpcoming && !isLiveNow) {
        continue;
      }

      const isHomeEvent = d.team?.id
        ? String(d.team.id) === String(homeComp.id || homeComp.team?.id)
        : false;
      const isAwayEvent = d.team?.id
        ? String(d.team.id) === String(awayComp.id || awayComp.team?.id)
        : false;

      // Si el evento tiene equipo pero no corresponde ni a local ni a visitante, descartar
      if (d.team?.id && !isHomeEvent && !isAwayEvent) {
        continue;
      }

      let eventType: MatchEventDetail['type'] = 'goal';
      let eventText = 'Gol';

      if (isDisallowed) {
        eventType = 'disallowed-goal';
        eventText = 'Gol Anulado';
      } else if (isVar && !isGoal && !isRed && !isYellow) {
        eventType = 'var';
        eventText = 'Revisión VAR';
      } else if (isPenaltyScored) {
        eventType = 'penalty-goal';
        eventText = 'Gol de Penal';
      } else if (isPenaltyMissed) {
        eventType = 'penalty-miss';
        eventText = 'Penal Fallado';
      } else if (isOwnGoal) {
        eventType = 'own-goal';
        eventText = 'Autogol';
      } else if (isRed) {
        eventType = 'red-card';
        eventText = 'Tarjeta Roja';
      } else if (isYellow) {
        eventType = 'yellow-card';
        eventText = 'Tarjeta Amarilla';
      } else if (isGoal) {
        eventType = 'goal';
        eventText = 'Gol';
      }

      const athlete = d.athletesInvolved?.[0];

      parsedEvents.push({
        id: `${d.clock?.value || d.clock?.displayValue || Math.random()}-${athlete?.displayName || eventText}`,
        type: eventType,
        minute: eventMinuteStr,
        text: eventText,
        teamId: d.team?.id ? String(d.team.id) : undefined,
        isHome: isHomeEvent,
        playerName: athlete?.displayName || athlete?.fullName || (isGoal ? 'Gol' : isDisallowed ? 'Gol Anulado' : isVar ? 'Decisión VAR' : 'Jugador'),
        playerShortName: athlete?.shortName,
        jersey: athlete?.jersey,
      });
    }
  }

  // Mapa de dorsales de atletas a partir de competition.details
  const athleteJerseyMap = new Map<string, string>();
  if (Array.isArray(competition.details)) {
    for (const d of competition.details) {
      if (Array.isArray(d.athletesInvolved)) {
        for (const a of d.athletesInvolved) {
          if (a.id && a.jersey) athleteJerseyMap.set(String(a.id), String(a.jersey));
          if (a.displayName && a.jersey) athleteJerseyMap.set(String(a.displayName), String(a.jersey));
          if (a.fullName && a.jersey) athleteJerseyMap.set(String(a.fullName), String(a.jersey));
        }
      }
    }
  }

  // ── 2. Enriquecer con summary endpoint de ESPN ───────────────────────────
  if (event.id && (isLiveNow || isFinishedToday)) {
    try {
      const sumLeague = event._leagueSlug || 'mex.1';
      const sumUrl = `https://site.web.api.espn.com/apis/site/v2/sports/soccer/${sumLeague}/summary?event=${event.id}`;
      const sumRes = await fetch(sumUrl, {
        headers: espnHeaders,
        signal: AbortSignal.timeout(2400),
      });
      if (sumRes.ok) {
        const sumData = await sumRes.json();

        // 2.1 KeyEvents (Penales, tarjetas, goles)
        if (Array.isArray(sumData.keyEvents)) {
          for (const k of sumData.keyEvents) {
            const kType = (k.type?.text || '').toLowerCase();
            const isPenSaved = kType.includes('penalty - saved') || kType.includes('penalty saved') || k.type?.id === '114';
            const isPenMissed = kType.includes('penalty - missed') || kType.includes('penalty missed') || k.type?.id === '73';
            const isDisallow = kType.includes('disallowed') || kType.includes('anulado') || kType.includes('overturned') || kType.includes('no goal');
            const isVarCheck = kType.includes('var') || kType.includes('video assistant');
            const isPenScored = kType.includes('penalty - scored') || kType.includes('penalty scored') || k.type?.id === '98';

            if (!isPenSaved && !isPenMissed && !isDisallow && !isVarCheck && !isPenScored) {
              continue;
            }

            const kClock = k.clock?.displayValue || (k.clock?.value ? `${Math.floor(k.clock.value / 60)}'` : '');
            if (!kClock) continue;

            const kMinMatch = kClock.match(/^(\d+)/);
            if (isLiveNow && matchCurrentMinute != null && kMinMatch) {
              const kmNum = parseInt(kMinMatch[1], 10);
              if (kmNum > matchCurrentMinute + 2) continue;
            }

            const alreadyExists = parsedEvents.some(
              pe => pe.minute === kClock && (
                (isPenSaved || isPenMissed) ? (pe.type === 'penalty-miss' || pe.type === 'goal') : pe.text === k.type?.text
              )
            );
            if (alreadyExists) continue;

            const athlete = k.participants?.[0]?.athlete;
            const pName = athlete?.displayName || k.text?.match(/([A-ZÁÉÍÓÚÑ][a-záéíóúñ]+(?:\s+[A-ZÁÉÍÓÚÑ][a-záéíóúñ]+)+)/)?.[1] || (isPenSaved || isPenMissed ? 'Penal' : 'Incidencia');
            const jerseyFromMap = athlete?.id ? athleteJerseyMap.get(String(athlete.id)) : (pName ? athleteJerseyMap.get(pName) : undefined);

            const isHomeEvt = k.team?.displayName
              ? k.team.displayName.toLowerCase().includes(homeRawName.toLowerCase()) || homeRawName.toLowerCase().includes(k.team.displayName.toLowerCase())
              : true;

            // A. GOL DE PENAL: Evitar duplicar con gol ya parseado en competition.details
            if (isPenScored) {
              const existingGoalIndex = parsedEvents.findIndex(
                pe => pe.minute === kClock && pe.isHome === isHomeEvt && (pe.type === 'goal' || pe.type === 'penalty-goal')
              );
              if (existingGoalIndex >= 0) {
                parsedEvents[existingGoalIndex].type = 'penalty-goal';
                parsedEvents[existingGoalIndex].text = 'Gol de Penal';
                if (pName && pName !== 'Penal' && (!parsedEvents[existingGoalIndex].playerName || parsedEvents[existingGoalIndex].playerName === 'Gol')) {
                  parsedEvents[existingGoalIndex].playerName = pName;
                }
                if (jerseyFromMap && !parsedEvents[existingGoalIndex].jersey) {
                  parsedEvents[existingGoalIndex].jersey = jerseyFromMap;
                }
                continue;
              }
            }

            // B. PENAL FALLADO: Evitar duplicados
            if (isPenSaved || isPenMissed) {
              const alreadyPenMiss = parsedEvents.some(
                pe => pe.minute === kClock && pe.isHome === isHomeEvt && pe.type === 'penalty-miss'
              );
              if (alreadyPenMiss) continue;
            }

            // C. GOL ANULADO: Reemplazar gol original si existía en vez de duplicar
            if (isDisallow) {
              const existingGoalIdx = parsedEvents.findIndex(
                pe => pe.minute === kClock && pe.isHome === isHomeEvt && (pe.type === 'goal' || pe.type === 'penalty-goal')
              );
              if (existingGoalIdx >= 0) {
                parsedEvents[existingGoalIdx].type = 'disallowed-goal';
                parsedEvents[existingGoalIdx].text = 'Gol Anulado (VAR)';
                parsedEvents[existingGoalIdx].disallowed = true;
                if (pName && pName !== 'Incidencia') parsedEvents[existingGoalIdx].playerName = pName;
                continue;
              }
            }

            // D. REVISIÓN VAR: Descartar si ya hay gol, penal o anulación en este minuto
            if (isVarCheck) {
              const hasPrimaryEvent = parsedEvents.some(
                pe => pe.minute === kClock && pe.isHome === isHomeEvt && (pe.type === 'goal' || pe.type === 'penalty-goal' || pe.type === 'disallowed-goal' || pe.type === 'penalty-miss')
              );
              if (hasPrimaryEvent) continue;
            }

            let eType: MatchEventDetail['type'] = 'penalty-miss';
            let eText = 'Penal Fallado';
            if (isPenSaved) {
              eType = 'penalty-miss';
              eText = 'Penal Atajado';
            } else if (isPenMissed) {
              eType = 'penalty-miss';
              eText = 'Penal Fallado';
            } else if (isPenScored) {
              eType = 'penalty-goal';
              eText = 'Gol de Penal';
            } else if (isDisallow) {
              eType = 'disallowed-goal';
              eText = 'Gol Anulado (VAR)';
            } else if (isVarCheck) {
              eType = 'var';
              eText = 'Revisión VAR';
            }

            parsedEvents.push({
              id: `key-${k.id || kClock}-${pName}`,
              type: eType,
              minute: kClock,
              text: eText,
              teamId: isHomeEvt ? (homeComp.id ? String(homeComp.id) : undefined) : (awayComp.id ? String(awayComp.id) : undefined),
              isHome: isHomeEvt,
              playerName: pName,
              jersey: jerseyFromMap,
            });
          }
        }

        // 2.2 Commentary: Goles Anulados por VAR y motivos exactos (Offside, Mano, etc.)
        if (Array.isArray(sumData.commentary)) {
          for (const c of sumData.commentary) {
            const play = c.play;
            const txt = (c.text || play?.text || '').trim();
            const lower = txt.toLowerCase();
            const playTypeId = String(play?.type?.id || '');
            const playType = (play?.type?.type || '').toLowerCase();

            const isOverturnedGoal =
              playTypeId === '175' ||
              playType.includes('deleted-after-review') ||
              lower.includes('goal overturned by var') ||
              lower.includes('goal is ruled out after a var review') ||
              lower.includes('gol anulado tras') ||
              lower.includes('gol anulado por');

            const isVarDecisionNoGoal =
              playTypeId === '172' ||
              lower.includes('var decision: no goal') ||
              lower.includes('decisión var: no gol');

            if (isOverturnedGoal || isVarDecisionNoGoal) {
              const clock = c.time?.displayValue || play?.clock?.displayValue || (c.time?.value ? `${Math.floor(c.time.value / 60)}'` : '');
              if (!clock) continue;

              const commMinMatch = clock.match(/^(\d+)/);
              if (isLiveNow && matchCurrentMinute != null && commMinMatch) {
                const cNum = parseInt(commMinMatch[1], 10);
                if (cNum > matchCurrentMinute + 2) continue;
              }

              const athlete = play?.participants?.[0]?.athlete || c.participants?.[0]?.athlete;
              const pName = athlete?.displayName || txt.match(/([A-ZÁÉÍÓÚÑ][a-záéíóúñ]+(?:\s+[A-ZÁÉÍÓÚÑ][a-záéíóúñ]+)+)/)?.[1] || 'Jugador';
              const jerseyFromMap = athlete?.id ? athleteJerseyMap.get(String(athlete.id)) : (pName ? athleteJerseyMap.get(pName) : undefined);

              const teamDisplayName = play?.team?.displayName || c.team?.displayName || '';
              const isHomeEvt = teamDisplayName
                ? teamDisplayName.toLowerCase().includes(homeRawName.toLowerCase()) || homeRawName.toLowerCase().includes(teamDisplayName.toLowerCase())
                : true;

              let reason = 'VAR';
              if (lower.includes('offside') || lower.includes('fuera de juego')) {
                reason = 'Fuera de Juego';
              } else if (lower.includes('handball') || lower.includes('hand ball') || lower.includes('mano')) {
                reason = 'Mano';
              } else if (lower.includes('foul') || lower.includes('falta')) {
                reason = 'Falta Previa';
              }

              const existingGoalIndex = parsedEvents.findIndex(
                pe => pe.minute === clock && pe.isHome === isHomeEvt && (pe.type === 'goal' || pe.type === 'penalty-goal')
              );
              if (existingGoalIndex >= 0) {
                parsedEvents[existingGoalIndex].type = 'disallowed-goal';
                parsedEvents[existingGoalIndex].text = `Gol Anulado - ${reason}`;
                parsedEvents[existingGoalIndex].disallowed = true;
                if (pName && pName !== 'Jugador') {
                  parsedEvents[existingGoalIndex].playerName = pName;
                }
                if (jerseyFromMap && !parsedEvents[existingGoalIndex].jersey) {
                  parsedEvents[existingGoalIndex].jersey = jerseyFromMap;
                }
              } else {
                const existingDisallowed = parsedEvents.some(
                  pe => pe.minute === clock && pe.isHome === isHomeEvt && pe.type === 'disallowed-goal'
                );
                if (!existingDisallowed) {
                  parsedEvents.push({
                    id: `disallowed-${clock}-${pName}`,
                    type: 'disallowed-goal',
                    minute: clock,
                    text: `Gol Anulado - ${reason}`,
                    teamId: isHomeEvt ? (homeComp.id ? String(homeComp.id) : undefined) : (awayComp.id ? String(awayComp.id) : undefined),
                    isHome: isHomeEvt,
                    playerName: pName,
                    jersey: jerseyFromMap,
                    disallowed: true,
                  });
                }
              }

              // Eliminar cualquier evento de 'var' genérico en este minuto para este equipo
              parsedEvents = parsedEvents.filter(
                pe => !(pe.minute === clock && pe.isHome === isHomeEvt && pe.type === 'var')
              );
            }
          }
        }
      }
    } catch {
      // Continuar sin summary si falla
    }
  }

  // ── 3. Sanitización y deduplicación extrema de incidencias ────────────────
  const getMinCanonical = (str?: string): number => {
    if (!str) return 0;
    const m = str.match(/(\d+)(?:\+(\d+))?/);
    if (!m) return 0;
    return parseInt(m[1], 10) * 100 + parseInt(m[2] || '0', 10);
  };

  // A) Si existe un 'penalty-goal', eliminar cualquier 'goal' genérico en el mismo minuto y equipo
  const penaltySet = new Set(
    parsedEvents
      .filter(e => e.type === 'penalty-goal')
      .map(e => `${getMinCanonical(e.minute)}_${e.isHome}`)
  );
  parsedEvents = parsedEvents.filter(e => {
    if (e.type === 'goal') {
      const key = `${getMinCanonical(e.minute)}_${e.isHome}`;
      if (penaltySet.has(key)) return false;
    }
    return true;
  });

  // B) Si existe un 'disallowed-goal', eliminar cualquier 'goal' o 'var' en el mismo minuto y equipo
  const disallowedSet = new Set(
    parsedEvents
      .filter(e => e.type === 'disallowed-goal')
      .map(e => `${getMinCanonical(e.minute)}_${e.isHome}`)
  );
  parsedEvents = parsedEvents.filter(e => {
    const key = `${getMinCanonical(e.minute)}_${e.isHome}`;
    if (disallowedSet.has(key)) {
      if (e.type === 'goal' || e.type === 'var') return false;
    }
    return true;
  });

  // C) Eliminar evento genérico 'var' si en el mismo minuto y equipo ya hay gol, penal o tarjeta
  const primaryEventSet = new Set(
    parsedEvents
      .filter(e => e.type === 'goal' || e.type === 'penalty-goal' || e.type === 'penalty-miss' || e.type === 'disallowed-goal' || e.type === 'red-card')
      .map(e => `${getMinCanonical(e.minute)}_${e.isHome}`)
  );
  parsedEvents = parsedEvents.filter(e => {
    if (e.type === 'var') {
      const key = `${getMinCanonical(e.minute)}_${e.isHome}`;
      if (primaryEventSet.has(key)) return false;
    }
    return true;
  });

  // D) Deduplicar eventos estrictamente idénticos (mismo minuto, equipo, tipo y jugador)
  const seenSignatures = new Set<string>();
  parsedEvents = parsedEvents.filter(e => {
    const pInitial = (e.playerName || '').trim().toLowerCase().split(' ')[0] || '';
    const sig = `${getMinCanonical(e.minute)}_${e.isHome}_${e.type}_${pInitial}`;
    if (seenSignatures.has(sig)) return false;
    seenSignatures.add(sig);
    return true;
  });

  // E) Ordenar cronológicamente (1', 2', 45', 45+2', 90', 90+5')
  parsedEvents.sort((a, b) => {
    const diff = getMinCanonical(a.minute) - getMinCanonical(b.minute);
    if (diff !== 0) return diff;
    const typePriority: Record<string, number> = {
      'disallowed-goal': 1,
      'penalty-miss': 2,
      'penalty-goal': 3,
      'goal': 4,
      'red-card': 5,
      'yellow-card': 6,
      'var': 7,
      'own-goal': 8,
    };
    return (typePriority[a.type] || 99) - (typePriority[b.type] || 99);
  });

  return parsedEvents;
}
