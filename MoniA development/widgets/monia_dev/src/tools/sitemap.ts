const axios = require('axios');
const { parseSitemap } = require('sitemap');
const robotsParser = require('robotstxt-parser');

let robots;

// Fonction pour extraire les URLs d'un sitemap
async function extractUrlsFromSitemap(url) {
    // Vérifier si l'URL est autorisée par robots.txt
    if (robots && !robots.isAllowed(url, 'MoniAbot')) {
        console.log(`Scraping non autorisé par robots.txt pour l'URL: ${url}`);
        return [];
    }

    try {
        const response = await axios.get(url);
        const sitemapContent = response.data;
        const urls = await parseSitemap(sitemapContent);

        return urls.map(u => u.url);
    } catch (error) {
        console.error(`Erreur lors de la lecture du sitemap ${url}: ${error}`);
        return [];
    }
}

// Fonction pour vérifier et traiter un sitemap
async function processSitemap(url) {
    const urls = await extractUrlsFromSitemap(url);
    console.log(`URLs trouvées dans ${url}:`, urls);

    // Vérifier chaque URL pour voir si c'est un sous-sitemap
    for (const sitemapUrl of urls) {
        if (sitemapUrl.endsWith('.xml')) {
            await processSitemap(sitemapUrl); // Traitement récursif pour les sous-sitemaps
        }
    }
}

// Fonction pour obtenir les URLs des sitemaps à partir de robots.txt
async function getSitemapUrlsFromRobotsTxt(robotsTxtUrl) {
    try {
        const response = await axios.get(robotsTxtUrl);
        const robotsTxt = response.data;
        robots = new robotsParser();
        await robots.parseRobots(robotsTxt);

        return robots.getSitemaps(); // Retourne les URLs des sitemaps
    } catch (error) {
        console.error(`Erreur lors de la récupération de robots.txt: ${error}`);
        return [];
    }
}

// Fonction principale
async function main() {
    const siteUrl = 'https://example.com'; // Remplacez par l'URL du site souhaité
    try {
        // Initialiser et analyser le fichier robots.txt
        await getSitemapUrlsFromRobotsTxt(`${siteUrl}/robots.txt`);

        // Essayer de traiter le sitemap principal
        await processSitemap(`${siteUrl}/sitemap.xml`);
    } catch (error) {
        console.error('Aucun sitemap principal trouvé, recherche dans robots.txt');
        // Si le sitemap principal n'est pas trouvé, chercher dans robots.txt
        const sitemapUrls = await getSitemapUrlsFromRobotsTxt(`${siteUrl}/robots.txt`);
        for (const sitemapUrl of sitemapUrls) {
            await processSitemap(sitemapUrl);
        }
    }
}

main();
