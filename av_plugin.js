function getManifest() {
    return JSON.stringify({
        "id": "mv",
        "name": "MV",
        "version": "1.1.3",
        "baseUrl": "https://vnjav.net",
        "iconUrl": "https://raw.githubusercontent.com/loiikoii/zax/refs/heads/main/miss.ico",
        "isEnabled": true,
        "isAdult": true,
        "type": "VIDEO",
        "layoutType": "HORIZONTAL",
        "subtitleCat": true,
        "useWebView": true
    });
}

function getHomeSections() {
    return JSON.stringify([
        { slug: "videos", title: "Mới Nhất", type: "Grid", path: "videos" },
        { slug: "videos?sort=views", title: "Xem Nhiều", type: "Grid", path: "videos?sort=views" },
        { slug: "videos?sort=likes", title: "Thích Nhiều", type: "Grid", path: "videos?sort=likes" },
        { slug: "videos?sort=comments", title: "Bình Luận Nhiều", type: "Grid", path: "videos?sort=comments" },
        { slug: "videos?sort=oldest", title: "Cũ Nhất", type: "Grid", path: "videos?sort=oldest" },
        { slug: "dien-vien", title: "Diễn Viên", type: "Grid", path: "dien-vien" }
    ]);
}

function getPrimaryCategories() {
    return JSON.stringify([
        { name: "Mới Nhất", slug: "videos" },
        { name: "Xem Nhiều", slug: "videos?sort=views" },
        { name: "Thích Nhiều", slug: "videos?sort=likes" },
        { name: "Bình Luận Nhiều", slug: "videos?sort=comments" },
        { name: "Cũ Nhất", slug: "videos?sort=oldest" },
        { name: "Diễn Viên", slug: "dien-vien" }
    ]);
}

function getFilterConfig() {
    return JSON.stringify({
        sort: [
            { label: "Mới nhất", value: "videos" },
            { label: "Xem nhiều", value: "videos?sort=views" },
            { label: "Thích nhiều", value: "videos?sort=likes" },
            { label: "Bình luận nhiều", value: "videos?sort=comments" },
            { label: "Cũ nhất", value: "videos?sort=oldest" }
        ],
        category: []
    });
}

function getUrlList(slug, filtersJson) {
    var filters = {};
    try {
        filters = JSON.parse(filtersJson || "{}");
    } catch (e) {
        filters = {};
    }
    var page = filters.page || 1;
    var cleanSlug = String(slug || "videos").replace(/^\/+/, "");

    if (!cleanSlug) {
        cleanSlug = "videos";
    }

    if (page > 1) {
        var sep = cleanSlug.indexOf("?") === -1 ? "?" : "&";
        return "https://vnjav.net/" + cleanSlug + sep + "page=" + page;
    }

    return "https://vnjav.net/" + cleanSlug;
}

function getUrlSearch(keyword, filtersJson) {
    var filters = {};
    try {
        filters = JSON.parse(filtersJson || "{}");
    } catch (e) {
        filters = {};
    }
    var page = filters.page || 1;
    var q = encodeURIComponent(String(keyword || "").trim());
    var url = "https://vnjav.net/tim-kiem?q=" + q;
    if (page > 1) {
        url += "&page=" + page;
    }
    return url;
}

function getUrlDetail(slug) {
    if (!slug) return "https://vnjav.net/videos";
    var s = String(slug).trim();
    var dupIdx = s.indexOf("http", 1);
    if (dupIdx !== -1) s = s.substring(dupIdx);
    if (s.indexOf("http") === 0) return s;
    s = s.replace(/^\/+/, "");
    return "https://vnjav.net/" + s;
}

function getUrlCategories() { return "https://vnjav.net/videos"; }
function getUrlCountries() { return ""; }
function getUrlYears() { return ""; }

function parseListResponse(html) {
    var movies = [];
    var seen = {};
    var linkRegex = /<a[^>]+href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;
    var match;

    while ((match = linkRegex.exec(html)) !== null) {
        var href = match[1] || "";
        var inner = match[2] || "";
        var imgMatch = inner.match(/<img[^>]+(?:data-src|src)=["']([^"']+)["'][^>]*>/i);
        if (!imgMatch) continue;

        if (href.indexOf("vnjav.net") !== -1 && href.indexOf("https://vnjav.net") !== 0) {
            href = href.replace(/^https?:\/\/[^/]+/i, "");
        }
        if (href.indexOf("http") === 0 && href.indexOf("https://vnjav.net") !== 0) continue;
        if (!href || href === "/" || href.indexOf("#") === 0) continue;

        var slug = href.replace(/^https?:\/\/vnjav\.net/i, "");
        if (slug.indexOf("/") !== 0) slug = "/" + slug;
        if (seen[slug]) continue;
        seen[slug] = true;

        var altMatch = inner.match(/<img[^>]+alt=["']([^"']+)["']/i) || inner.match(/title=["']([^"']+)["']/i);
        var title = altMatch ? altMatch[1] : inner.replace(/<[^>]+>/g, " ");
        title = title.replace(/\s+/g, " ").trim();
        if (!title) continue;

        var poster = imgMatch[1];
        if (poster && poster.indexOf("//") === 0) {
            poster = "https:" + poster;
        } else if (poster && poster.indexOf("/") === 0) {
            poster = "https://vnjav.net" + poster;
        }

        movies.push({
            id: slug,
            title: title,
            posterUrl: poster,
            backdropUrl: poster,
            description: "",
            year: 0,
            quality: "HD",
            episode_current: "Full",
            lang: "Vietsub"
        });
    }

    return JSON.stringify({
        items: movies,
        pagination: {
            currentPage: 1,
            totalPages: 1,
            totalItems: movies.length,
            itemsPerPage: movies.length || 20
        }
    });
}

function parseSearchResponse(html) {
    return parseListResponse(html);
}

function parseMovieDetail(html) {
    try {
        var ogTitle = html.match(/property=["']og:title["'][^>]+content=["']([^"']+)["']/i);
        var ogImage = html.match(/property=["']og:image["'][^>]+content=["']([^"']+)["']/i);
        var ogDesc = html.match(/property=["']og:description["'][^>]+content=["']([^"']+)["']/i);

        var streamUrl = "";
        var m3u8Match = html.match(/(https?:\/\/[^"'\\\s<>]+\.m3u8[^"'\\\s<>]*)/i);
        var mp4Match = html.match(/(https?:\/\/[^"'\\\s<>]+\.mp4[^"'\\\s<>]*)/i);
        var embedMatch = html.match(/"embedUrl"\s*:\s*"(https?:\/\/[^"]+)"/i) ||
                         html.match(/(https?:\/\/streamtape\.com\/e\/[^"'\\\s<>]+)/i);
        var iframeMatch = html.match(/<iframe[^>]+src=["']([^"']+)["']/i);

        if (m3u8Match) streamUrl = m3u8Match[1];
        else if (mp4Match) streamUrl = mp4Match[1];
        else if (embedMatch) streamUrl = embedMatch[1].replace(/\\\//g, "/");
        else if (iframeMatch) streamUrl = iframeMatch[1];

        var servers = [];
        if (streamUrl) {
            servers.push({
                name: "Server 1",
                episodes: [{ id: streamUrl, name: "Full", slug: "full" }]
            });
        }

        return JSON.stringify({
            id: "",
            title: ogTitle ? ogTitle[1].trim() : "Video",
            posterUrl: ogImage ? ogImage[1] : "",
            backdropUrl: ogImage ? ogImage[1] : "",
            description: ogDesc ? ogDesc[1].trim() : "",
            servers: servers,
            quality: "HD",
            lang: "Vietsub",
            year: 0,
            rating: 0,
            casts: "",
            director: "",
            category: "",
            status: "",
            duration: "",
            previewUrl: ""
        });
    } catch (e) {
        return "null";
    }
}

function parseDetailResponse(html) {
    var detail = JSON.parse(parseMovieDetail(html));
    var url = (detail && detail.servers && detail.servers.length > 0) ? detail.servers[0].episodes[0].id : "";
    return JSON.stringify({
        url: url,
        headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            "Referer": "https://vnjav.net/"
        },
        subtitles: []
    });
}

function parseCategoriesResponse(html) {
    return JSON.stringify([
        { name: "Mới Nhất", slug: "videos" },
        { name: "Xem Nhiều", slug: "videos?sort=views" },
        { name: "Thích Nhiều", slug: "videos?sort=likes" },
        { name: "Bình Luận Nhiều", slug: "videos?sort=comments" },
        { name: "Cũ Nhất", slug: "videos?sort=oldest" },
        { name: "Diễn Viên", slug: "dien-vien" }
    ]);
}

function parseCountriesResponse(html) { return "[]"; }
function parseYearsResponse(html) { return "[]"; }
