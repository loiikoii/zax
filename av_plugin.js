function getManifest() {
    return JSON.stringify({
        "id": "vnjav",
        "name": "VNJav",
        "version": "1.2.0",
        "baseUrl": "https://vnjav.net",
        "iconUrl": "https://stpaulclinic.vn/vaapp/plugins/missav.ico",
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

        if (href.indexOf("/video/") === -1 && href.indexOf("/dien-vien/") === -1) continue;

        var imgMatch = inner.match(/<img[^>]+(?:data-src|src)=["']([^"']+)["'][^>]*>/i);
        if (!imgMatch) continue;

        if (href.indexOf("http") === 0 && href.indexOf("https://vnjav.net") !== 0) continue;

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
        var cleanHtml = String(html || "").replace(/\\"/g, '"').replace(/\\\//g, "/");

        var ogTitle = cleanHtml.match(/property=["']og:title["'][^>]+content=["']([^"']+)["']/i);
        var ogImage = cleanHtml.match(/property=["']og:image["'][^>]+content=["']([^"']+)["']/i);
        var ogDesc = cleanHtml.match(/property=["']og:description["'][^>]+content=["']([^"']+)["']/i);

        var servers = [];
        var seenUrls = {};

        function addServer(serverName, streamUrl) {
            if (!streamUrl) return;
            var cleanUrl = String(streamUrl).trim();
            if (!cleanUrl || seenUrls[cleanUrl]) return;
            seenUrls[cleanUrl] = true;
            servers.push({
                name: serverName || ("Server " + (servers.length + 1)),
                episodes: [
                    {
                        id: cleanUrl,
                        name: "Full",
                        slug: "full",
                        url: cleanUrl
                    }
                ]
            });
        }

        // 1. Quét các khối có "label" và "embedUrl" (Server 1, Server 2, Server 3...)
        var objRegex = /\{[^{}]*"embedUrl"\s*:\s*"([^"]+)"[^{}]*\}/gi;
        var objMatch;
        while ((objMatch = objRegex.exec(cleanHtml)) !== null) {
            var block = objMatch[0];
            var embedVal = objMatch[1];
            var lblMatch = block.match(/"label"\s*:\s*"([^"]+)"/i);
            var lblName = lblMatch ? lblMatch[1] : ("Server " + (servers.length + 1));
            addServer(lblName, embedVal);
        }

        // 2. Dự phòng nếu "label" và "embedUrl" nằm gần nhau trong phạm vi ngắn
        var nearRegex = /"label"\s*:\s*"([^"]+)"[\s\S]{0,160}?"embedUrl"\s*:\s*"([^"]+)"/gi;
        var nearMatch;
        while ((nearMatch = nearRegex.exec(cleanHtml)) !== null) {
            addServer(nearMatch[1], nearMatch[2]);
        }

        // 3. Bắt link .m3u8 hoặc .mp4 trực tiếp nếu có sẵn trong mã nguồn
        var directRegex = /(https?:\/\/[^"'\s<>]+\.(?:m3u8|mp4)[^"'\s<>]*)/gi;
        var directMatch;
        var directCount = 1;
        while ((directMatch = directRegex.exec(cleanHtml)) !== null) {
            addServer("Direct #" + (directCount++), directMatch[1]);
        }

        // 4. Bắt thẻ <iframe> nếu có
        var iframeRegex = /<iframe[^>]+src=["']([^"']+)["']/gi;
        var iframeMatch;
        var iframeCount = 1;
        while ((iframeMatch = iframeRegex.exec(cleanHtml)) !== null) {
            addServer("Embed #" + (iframeCount++), iframeMatch[1]);
        }

        // 5. Nhánh dự phòng: suy đoán thư mục /hls/... từ ảnh screenshot.jpg
        var shotRegex = /(https?:\/\/[^"'\s<>]+\/hls\/[^"'\s<>]*?)\/screenshot\.jpg/gi;
        var shotMatch;
        var shotCount = 1;
        while ((shotMatch = shotRegex.exec(cleanHtml)) !== null) {
            var hlsDir = shotMatch[1];
            var idx = shotCount++;
            addServer("HLS Dự phòng (master) #" + idx, hlsDir + "/master.m3u8");
            addServer("HLS Dự phòng (playlist) #" + idx, hlsDir + "/playlist.m3u8");
            addServer("HLS Dự phòng (index) #" + idx, hlsDir + "/index.m3u8");
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

function parseDetailResponse(html, episodeIdOrUrl) {
    try {
        var detail = JSON.parse(parseMovieDetail(html));
        var url = "";
        var target = episodeIdOrUrl ? String(episodeIdOrUrl).trim().replace(/\\\//g, "/") : "";

        if (target && /^https?:\/\//i.test(target)) {
            url = target;
        } else if (detail && detail.servers && detail.servers.length > 0) {
            if (target) {
                for (var i = 0; i < detail.servers.length; i++) {
                    var eps = detail.servers[i].episodes || [];
                    for (var j = 0; j < eps.length; j++) {
                        var epId = String(eps[j].id || "").replace(/\\\//g, "/");
                        var epUrl = String(eps[j].url || "").replace(/\\\//g, "/");
                        if (epId === target || epUrl === target) {
                            url = epUrl || epId;
                            break;
                        }
                    }
                    if (url) break;
                }
            }
            if (!url) {
                url = detail.servers[0].episodes[0].url || detail.servers[0].episodes[0].id || "";
            }
        }

        return JSON.stringify({
            url: url,
            headers: {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
                "Referer": "https://vnjav.net/"
            },
            subtitles: []
        });
    } catch (e) {
        return JSON.stringify({
            url: "",
            headers: {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
                "Referer": "https://vnjav.net/"
            },
            subtitles: []
        });
    }
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
