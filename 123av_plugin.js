// =============================================================================
// CONFIGURATION & METADATA
// =============================================================================

function getManifest() {
    return JSON.stringify({
        "id": "123",
        "name": "123",
        "version": "1.0.5",
        "baseUrl": "https://123av.org",
        "referrer": "https://123av.org/",
        "iconUrl": "https://123av.org/assets/123av/favicon.png",
        "isEnabled": true,
        "isAdult": true,
        "type": "VIDEO",
        "layoutType": "HORIZONTAL",
        "subtitleCat": false
    });
}

function getHomeSections() {
    return JSON.stringify([
        { slug: 'dm539/vi/new', title: 'Mới Cập Nhật', type: 'Horizontal', path: '' },
        { slug: 'dm635/vi/release', title: 'Thịnh Hành', type: 'Horizontal', path: '' },
        { slug: 'dm817/vi/uncensored-leak', title: 'Rò Rỉ (Uncensored Leak)', type: 'Horizontal', path: '' },
        { slug: 'vi/actresses', title: 'Nữ Diễn Viên', type: 'Horizontal', path: '' },
        { slug: 'vi/makers', title: 'Nhà Sản Xuất', type: 'Horizontal', path: '' }
    ]);
}

function getPrimaryCategories() {
    return JSON.stringify([
        { name: 'Mới cập nhật', slug: 'dm539/vi/new' },
        { name: 'Thịnh hành', slug: 'dm635/vi/release' },
        { name: 'Rò rỉ', slug: 'dm817/vi/uncensored-leak' },
        { name: 'Nữ diễn viên', slug: 'vi/actresses' },
        { name: 'Thể loại', slug: 'vi/genres' },
        { name: 'Nhà sản xuất', slug: 'vi/makers' }
    ]);
}

function getFilterConfig() {
    return JSON.stringify({
        sort: [
            { name: 'Mới nhất', value: 'new' },
            { name: 'Hôm nay', value: 'today' },
            { name: 'Tuần này', value: 'week' },
            { name: 'Tháng này', value: 'month' }
        ],
        category: [
            { name: "Mới cập nhật", value: "dm539/vi/new" },
            { name: "Thịnh hành", value: "dm635/vi/release" },
            { name: "Rò rỉ", value: "dm817/vi/uncensored-leak" },
            { name: "Nữ diễn viên", value: "vi/actresses" },
            { name: "Tất cả thể loại", value: "vi/genres" },
            { name: "Nhà sản xuất", value: "vi/makers" }
        ]
    });
}

// =============================================================================
// URL GENERATION
// =============================================================================

function getUrlList(slug, filtersJson) {
    var filters = JSON.parse(filtersJson || "{}");
    var page = filters.page || 1;
    var baseUrl = "https://123av.org";

    var path = String(slug || "dm539/vi/new").trim();
    if (path.indexOf("http") === 0) {
        path = path.replace(/^https?:\/\/[^\/]+/i, "");
    }
    if (path.indexOf("/") === 0) {
        path = path.substring(1);
    }

    // Nếu slug chưa có tiền tố ngôn ngữ hoặc dm..., mặc định thêm vi/
    if (
        path.indexOf("vi/") !== 0 &&
        path.indexOf("en/") !== 0 &&
        !/^dm\d+\//i.test(path)
    ) {
        path = "vi/" + path;
    }

    var url = baseUrl + "/" + path;

    if (url.indexOf("?") !== -1) {
        url += "&page=" + page;
    } else {
        url += "?page=" + page;
    }

    if (filters.sort && filters.sort !== "new") {
        url += "&sort=" + encodeURIComponent(filters.sort);
    }

    return url;
}

function getUrlSearch(keyword, filtersJson) {
    var filters = JSON.parse(filtersJson || "{}");
    var page = filters.page || 1;
    var cleanKeyword = encodeURIComponent(String(keyword || "").trim());
    return "https://123av.org/vi/search/" + cleanKeyword + "?page=" + page;
}

function getUrlDetail(slug) {
    if (!slug) return "";
    var cleanSlug = String(slug).trim();

    if (cleanSlug.indexOf("http") === 0) return cleanSlug;
    if (cleanSlug.indexOf("vi/v/") === 0 || cleanSlug.indexOf("en/v/") === 0) {
        return "https://123av.org/" + cleanSlug;
    }
    if (cleanSlug.indexOf("/vi/v/") === 0 || cleanSlug.indexOf("/en/v/") === 0) {
        return "https://123av.org" + cleanSlug;
    }
    if (cleanSlug.indexOf("v/") === 0) {
        return "https://123av.org/vi/" + cleanSlug;
    }
    if (cleanSlug.indexOf("/v/") === 0) {
        return "https://123av.org/vi" + cleanSlug;
    }
    return "https://123av.org/vi/v/" + cleanSlug;
}

function getUrlCategories() { return "https://123av.org/vi/genres"; }
function getUrlCountries() { return ""; }
function getUrlYears() { return ""; }

// =============================================================================
// PARSERS
// =============================================================================

var PluginUtils = {
    cleanText: function (text) {
        if (!text) return "";
        return text.replace(/<[^>]*>/g, "")
            .replace(/&amp;/g, "&")
            .replace(/&quot;/g, '"')
            .replace(/&#039;/g, "'")
            .replace(/&lt;/g, "<")
            .replace(/&gt;/g, ">")
            .replace(/\s+/g, " ")
            .trim();
    },
    getMeta: function (html, property) {
        var regex1 = new RegExp('(?:property|name)=["\']' + property + '["\'][^>]*content=(["\'])(.*?)\\1', 'i');
        var regex2 = new RegExp('content=(["\'])(.*?)\\1[^>]*(?:property|name)=["\']' + property + '["\']', 'i');
        var match = html.match(regex1) || html.match(regex2);
        return match ? match[2] : "";
    },
    decodePlayerJson: function (escapedStr) {
        try {
            var cleanStr = escapedStr.replace(/\\u([0-9a-fA-F]{4})/g, function (match, grp) {
                return String.fromCharCode(parseInt(grp, 16));
            }).replace(/\\/g, '');
            return JSON.parse(cleanStr);
        } catch (e) {
            return [];
        }
    }
};

function parseListResponse(html) {
    var movies = [];

    var actressLinkMatch = html.match(/href="[^"]*\/actresses\/[^"]+"/g);
    var isActressesPage = (actressLinkMatch && actressLinkMatch.length > 10 &&
        (html.indexOf('Actresses') !== -1 || html.indexOf('Nữ diễn viên') !== -1));

    var isAllGenresPage = (html.indexOf('/genres/') !== -1 &&
        (html.indexOf('Genres') !== -1 || html.indexOf('Thể loại') !== -1) &&
        html.indexOf('title="Genres"') === -1);

    if (isActressesPage) {
        var actressRegex = /<a[^>]+href="([^"]*\/actresses\/([^"\/]+))"[^>]*>([\s\S]*?)<\/a>/gi;
        var foundActresses = {};
        var match;

        while ((match = actressRegex.exec(html)) !== null) {
            var slug = "vi/actresses/" + match[2];
            var name = PluginUtils.cleanText(match[3]);
            if (!name || name.length < 2 || name.match(/^\d+/) || name.indexOf('.') !== -1) continue;

            if (!foundActresses[slug]) {
                movies.push({
                    id: slug,
                    title: name,
                    posterUrl: "",
                    backdropUrl: "",
                    description: "Nữ diễn viên",
                    year: 0,
                    quality: "ACTRESS",
                    episode_current: "",
                    lang: ""
                });
                foundActresses[slug] = true;
            }
        }
    } else if (isAllGenresPage) {
        var genreRegex = /<a[^>]+href="([^"]*\/genres\/([^"\/]+))"[^>]*>([\s\S]*?)<\/a>/gi;
        var foundGenres = {};
        var match;

        while ((match = genreRegex.exec(html)) !== null) {
            var slug = "vi/genres/" + match[2];
            var name = PluginUtils.cleanText(match[3]).replace(/\d+,\d+|\d+/g, '').trim();
            if (!name || name.length < 2) continue;

            if (!foundGenres[slug]) {
                movies.push({
                    id: slug,
                    title: name,
                    posterUrl: "",
                    backdropUrl: "",
                    description: "Thể loại",
                    year: 0,
                    quality: "CAT",
                    episode_current: "",
                    lang: ""
                });
                foundGenres[slug] = true;
            }
        }
    } else {
        var parts = html.split('class="card"');
        if (parts.length <= 1) {
            parts = html.split('class="featured"');
        }

        for (var i = 1; i < parts.length; i++) {
            var cardHtml = parts[i];

            var linkMatch = cardHtml.match(/href="([^"]*\/v\/([^"\/]+))"/i);
            if (!linkMatch) continue;
            var slug = "vi/v/" + linkMatch[2];

            var title = "";
            var titleMatch = cardHtml.match(/<h[23][^>]*>([\s\S]*?)<\/h[23]>/i);
            if (titleMatch) {
                title = titleMatch[1].replace(/<[^>]*>/g, "").trim();
            } else {
                var altMatch = cardHtml.match(/<img[^>]+alt="([^"]+)"/i);
                if (altMatch) title = altMatch[1].trim();
            }
            if (!title) title = linkMatch[2];

            var imgMatch = cardHtml.match(/<img[^>]+(?:src|data-src)="([^"]+)"/i);
            var poster = imgMatch ? imgMatch[1] : "";
            if (poster && poster.indexOf("//") === 0) poster = "https:" + poster;

            var durMatch = cardHtml.match(/class="(?:featured__dur|card__dur)"[^>]*>([^<]+)/i);
            var duration = durMatch ? durMatch[1].trim() : "";

            movies.push({
                id: slug,
                title: PluginUtils.cleanText(title),
                posterUrl: poster,
                backdropUrl: poster,
                description: duration ? "Thời lượng: " + duration : "",
                year: 0,
                quality: "HD",
                episode_current: duration,
                lang: "Vi"
            });
        }
    }

    var currentPage = 1;
    var totalPages = 1;

    var activePageMatch = html.match(/class="[^"]*active[^"]*"[^>]*>(\d+)<\/span>/i) ||
                          html.match(/class="[^"]*active[^"]*"[^>]*>(\d+)<\/a>/i);
    if (activePageMatch) currentPage = parseInt(activePageMatch[1], 10);

    var pageLinks = html.match(/page=(\d+)/g);
    if (pageLinks) {
        for (var p = 0; p < pageLinks.length; p++) {
            var num = parseInt(pageLinks[p].match(/\d+/)[0], 10);
            if (num > totalPages) totalPages = num;
        }
    }

    return JSON.stringify({
        items: movies,
        pagination: {
            currentPage: currentPage,
            totalPages: Math.max(totalPages, currentPage),
            totalItems: movies.length,
            itemsPerPage: 20
        }
    });
}

function parseSearchResponse(html) {
    return parseListResponse(html);
}

function parseMovieDetail(htmlContent) {
    try {
        var title = PluginUtils.getMeta(htmlContent, "og:title") || "";
        var thumb = PluginUtils.getMeta(htmlContent, "og:image") || "";
        var desc = PluginUtils.getMeta(htmlContent, "og:description") || "";

        var coverMatch = htmlContent.match(/style="background-image:url\(['"]?([^'")]+cover\.jpg[^'")]+)['"]?\)"/i) ||
                         htmlContent.match(/background-image:url\(['"]?([^'")]+cover\.jpg[^'")]+)['"]?\)/i) ||
                         htmlContent.match(/src="([^"]+cover\.jpg[^"]*)"/i);
        if (coverMatch) {
            thumb = coverMatch[1];
        } else if (thumb.indexOf("logo-square.png") !== -1 || thumb.indexOf("logo") !== -1) {
            var coverGenericMatch = htmlContent.match(/https?:\/\/[^\s"'><]+?\/cover\.jpg[^\s"'><]*/i);
            if (coverGenericMatch) {
                thumb = coverGenericMatch[0];
            }
        }

        var releaseMatch = htmlContent.match(/<dt>(?:Release date|Ngày phát hành)<\/dt>\s*<dd>([^<]+)<\/dd>/i);
        var year = 0;
        if (releaseMatch) {
            var yr = parseInt(releaseMatch[1].substring(0, 4), 10);
            if (yr) year = yr;
        }

        var actors = [];
        var actorPattern = /href="[^"]*\/actresses\/[^"]+">([^<]+)<\/a>/gi;
        var match;
        while ((match = actorPattern.exec(htmlContent)) !== null) {
            var aName = PluginUtils.cleanText(match[1]);
            if (aName && actors.indexOf(aName) === -1) actors.push(aName);
        }

        var genres = [];
        var genrePattern = /href="[^"]*\/genres\/[^"]+">([^<]+)<\/a>/gi;
        while ((match = genrePattern.exec(htmlContent)) !== null) {
            var gName = PluginUtils.cleanText(match[1]);
            if (gName && genres.indexOf(gName) === -1) genres.push(gName);
        }

        var director = "";
        var dirMatch = htmlContent.match(/<dt>(?:Maker|Nhà sản xuất)<\/dt>\s*<dd>[\s\S]*?href="[^"]*">([^<]+)<\/a>/i);
        if (dirMatch) director = PluginUtils.cleanText(dirMatch[1]);

        var servers = [];
        var playerJsonMatch = /player\(\s*JSON\.parse\(\s*['"]([^'"]+)['"]\s*\)/i.exec(htmlContent);

        if (playerJsonMatch) {
            var playerItems = PluginUtils.decodePlayerJson(playerJsonMatch[1]);
            var episodes = [];
            for (var i = 0; i < playerItems.length; i++) {
                var item = playerItems[i];
                episodes.push({
                    id: item.url,
                    name: "Server HD #" + (item.name || (i + 1)),
                    slug: "server-" + (i + 1)
                });
            }
            if (episodes.length > 0) {
                servers.push({
                    name: "123AV Play",
                    episodes: episodes
                });
            }
        }

        var slug = "";
        var canonicalMatch = htmlContent.match(/<link\s+rel="canonical"\s+href="https:\/\/123av\.org\/[^"\/]+\/v\/([^"]+)"/i);
        if (canonicalMatch) slug = canonicalMatch[1];

        return JSON.stringify({
            id: slug,
            title: PluginUtils.cleanText(title),
            posterUrl: thumb,
            backdropUrl: thumb,
            description: PluginUtils.cleanText(desc),
            year: year,
            rating: 0,
            quality: "HD",
            servers: servers,
            episode_current: servers.length > 0 ? "Full" : "No Source",
            lang: "Vi",
            category: genres.join(", "),
            country: "Japan",
            director: director,
            casts: actors.join(", ")
        });
    } catch (e) {
        return "null";
    }
}

function parseDetailResponse(htmlContent, pageUrl) {
    return JSON.stringify({
        url: pageUrl,
        isEmbed: true,
        headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            "Referer": "https://123av.org/"
        },
        subtitles: []
    });
}

function parseCategoriesResponse(html) {
    var categories = [];
    var genreRegex = /<a[^>]+href="([^"]*\/genres\/([^"\/]+))"[^>]*>([\s\S]*?)<\/a>/gi;
    var foundGenres = {};
    var match;

    while ((match = genreRegex.exec(html)) !== null) {
        var slug = "vi/genres/" + match[2];
        var name = PluginUtils.cleanText(match[3]).replace(/\d+,\d+|\d+/g, '').trim();
        if (!name || name.length < 2) continue;

        if (!foundGenres[slug]) {
            categories.push({ name: name, slug: slug });
            foundGenres[slug] = true;
        }
    }
    return JSON.stringify(categories);
}

function parseCountriesResponse(html) { return "[]"; }
function parseYearsResponse(html) { return "[]"; }
```[cite: 6]

### Điểm cần kiểm tra khi chạy thử trên app
Trong danh sách bạn gửi có `dm539/vi/new`, `dm635/vi/release`, `dm817/vi/uncensored-leak`, `vi/actresses`, `vi/genres`, `vi/makers`[cite: 6] (chưa có đường dẫn riêng cho mục "Có che" trên `123av.org`). Khi test trên app, nếu mục nào trả về danh sách trống do cấu trúc thẻ HTML của `123av.org` khác thẻ `.card` / `.featured` cũ, bạn chỉ cần gửi đoạn HTML mẫu của trang đó để mình chỉnh lại bộ lọc bóc tách cho khớp.
