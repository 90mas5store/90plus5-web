export interface FootballAlias {
    alias: string;
    targetTeam: string;
    tags?: string[];
}

export interface QuickSearchChip {
    label: string;
    query: string;
    href: string;
}

export const FOOTBALL_ALIASES: FootballAlias[] = [
    // Real Madrid
    { alias: 'merengues', targetTeam: 'Real Madrid' },
    { alias: 'blancos', targetTeam: 'Real Madrid' },
    { alias: 'madrid', targetTeam: 'Real Madrid' },
    { alias: 'vini', targetTeam: 'Real Madrid' },
    { alias: 'vinicius', targetTeam: 'Real Madrid' },
    { alias: 'bellingham', targetTeam: 'Real Madrid' },
    { alias: 'mbappe', targetTeam: 'Real Madrid' },
    { alias: 'rodrygo', targetTeam: 'Real Madrid' },
    { alias: 'modric', targetTeam: 'Real Madrid' },

    // Barcelona
    { alias: 'culers', targetTeam: 'Barcelona' },
    { alias: 'blaugrana', targetTeam: 'Barcelona' },
    { alias: 'barza', targetTeam: 'Barcelona' },
    { alias: 'barca', targetTeam: 'Barcelona' },
    { alias: 'yamal', targetTeam: 'Barcelona' },
    { alias: 'lamine', targetTeam: 'Barcelona' },
    { alias: 'pedri', targetTeam: 'Barcelona' },
    { alias: 'gavi', targetTeam: 'Barcelona' },
    { alias: 'lewandowski', targetTeam: 'Barcelona' },
    { alias: 'raphinha', targetTeam: 'Barcelona' },

    // Manchester City
    { alias: 'citizens', targetTeam: 'Manchester City' },
    { alias: 'city', targetTeam: 'Manchester City' },
    { alias: 'haaland', targetTeam: 'Manchester City' },
    { alias: 'de bruyne', targetTeam: 'Manchester City' },
    { alias: 'kdb', targetTeam: 'Manchester City' },
    { alias: 'foden', targetTeam: 'Manchester City' },

    // Manchester United
    { alias: 'red devils', targetTeam: 'Manchester United' },
    { alias: 'man u', targetTeam: 'Manchester United' },
    { alias: 'united', targetTeam: 'Manchester United' },
    { alias: 'rashford', targetTeam: 'Manchester United' },
    { alias: 'bruno', targetTeam: 'Manchester United' },
    { alias: 'garnacho', targetTeam: 'Manchester United' },

    // Arsenal
    { alias: 'gunners', targetTeam: 'Arsenal' },
    { alias: 'saka', targetTeam: 'Arsenal' },
    { alias: 'odegaard', targetTeam: 'Arsenal' },
    { alias: 'arteta', targetTeam: 'Arsenal' },

    // Liverpool
    { alias: 'reds', targetTeam: 'Liverpool' },
    { alias: 'salah', targetTeam: 'Liverpool' },
    { alias: 'diaz', targetTeam: 'Liverpool' },
    { alias: 'luis diaz', targetTeam: 'Liverpool' },

    // Chelsea
    { alias: 'blues', targetTeam: 'Chelsea' },
    { alias: 'palmer', targetTeam: 'Chelsea' },
    { alias: 'cole palmer', targetTeam: 'Chelsea' },

    // Bayern Munich & PSG
    { alias: 'bavaro', targetTeam: 'Bayern Múnich' },
    { alias: 'bayern', targetTeam: 'Bayern Múnich' },
    { alias: 'kane', targetTeam: 'Bayern Múnich' },
    { alias: 'musiala', targetTeam: 'Bayern Múnich' },
    { alias: 'psg', targetTeam: 'PSG' },
    { alias: 'parissaintgermain', targetTeam: 'PSG' },
    { alias: 'dembele', targetTeam: 'PSG' },

    // Honduras (Liga Nacional)
    { alias: 'albos', targetTeam: 'Olimpia' },
    { alias: 'leones', targetTeam: 'Olimpia' },
    { alias: 'rey de copas', targetTeam: 'Olimpia' },
    { alias: 'ciclon', targetTeam: 'Motagua' },
    { alias: 'aguilas', targetTeam: 'Motagua' },
    { alias: 'aurinegros', targetTeam: 'Real España' },
    { alias: 'maquina', targetTeam: 'Real España' },
    { alias: 'monstruo', targetTeam: 'Marathón' },
    { alias: 'verdolagas', targetTeam: 'Marathón' },

    // Icons & Legends
    { alias: 'cr7', targetTeam: 'Al Nassr' },
    { alias: 'cristiano', targetTeam: 'Al Nassr' },
    { alias: 'ronaldo', targetTeam: 'Al Nassr' },
    { alias: 'messi', targetTeam: 'Inter Miami' },
    { alias: 'leomessi', targetTeam: 'Inter Miami' },
];

export const QUICK_SEARCH_CHIPS: QuickSearchChip[] = [
    { label: '🔥 Más Vendidas', query: 'más vendidas', href: '/catalogo?orden=top_sellers' },
    { label: '⏪ Edición Retro', query: 'retro', href: '/catalogo?categoria=retro' },
    { label: '🏆 Champions League', query: 'champions', href: '/catalogo?liga=champions-league' },
    { label: '⚡ Manga Larga', query: 'manga larga', href: '/catalogo?query=manga%20larga' },
    { label: '👶 Niños', query: 'niños', href: '/catalogo?categoria=ninos' },
];
