/************************ REDIRECT CODE ***********************/
chrome.webRequest.onBeforeRequest.addListener(function (details) {
    return detectRedirect(details);
}, {
    urls: ["<all_urls>"],
    types: ["main_frame", "sub_frame"]
}, ["blocking"]);

function getAmazonUrlAndCountry(domain) {
    if (domain.includes("amazon.de")) {
        return { amazonurl: "www.amazon.de", country: "de" };
    } else if (domain.includes("amazon.co.uk")) {
        return { amazonurl: "www.amazon.co.uk", country: "uk" };
    }
    return { amazonurl: "www.amazon.com", country: "com" };
}

function detectRedirect({ url }) {
    const { url } = details;

    if (url == null) {
        return;
    }

    // ignore links with these strings in them
    const filter = "(sa-no-redirect=)"
        + "|(redirect=true)"
        + "|(redirect.html)"
        + "|(r.html)"
        + "|(f.html)"
        + "|(/dmusic/cloudplayer)"
        + "|(/photos)"
        + "|(/wishlist)"
        + "|(/clouddrive)"
        + "|(/ap/)"
        + "|(aws.amazon.)"
        + "|(read.amazon.)"
        + "|(login.amazon.)"
        + "|(payments.amazon.)"
        + "|(http://)"; //all Amazon pages now redirect to HTTPS, also fixes conflict with HTTPS Everywhere extension

    // Don't try and redirect pages that are in our filter
    if (url.match(filter) != null) {
        return;
    }

    const { amazonurl, country } = getAmazonUrlAndCountry(url_domain(url));
    return redirectToSmile("https://", amazonurl, url, country);
}

function redirectToSmile(scheme, amazonurl, url, country) {
    const smileurl = getSmileUrlByCountry(country);
    return {
        // redirect to amazon smile append the rest of the url
        redirectUrl: scheme + smileurl + getRelativeRedirectUrl(amazonurl, url)
    };
}

function getSmileUrlByCountry(country) {
    switch (country) {
        case "de":
            return "smile.amazon.de";
        case "uk":
            return "smile.amazon.co.uk";
        default:
            return "smile.amazon.com";
    }
}

function getRelativeRedirectUrl(amazonurl, url) {
    const relativeUrl = url.split(amazonurl)[1];
    const noRedirectIndicator = "sa-no-redirect=1";
    const paramStart = "?";
    const paramStartRegex = "\\" + paramStart;

    // check to see if there are already GET variables in the url
    if (relativeUrl.match(paramStartRegex) != null) {
        return relativeUrl + "&" + noRedirectIndicator;
    } else {
        return relativeUrl + paramStart + noRedirectIndicator;
    }
    return null;
}

function url_domain(data) {
    const a = document.createElement('a');
    a.href = data;
    return a.hostname;
}
