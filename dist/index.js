/******/ (() => { // webpackBootstrap
/******/ 	var __webpack_modules__ = ({

/***/ 451:
/***/ ((module, __unused_webpack_exports, __nccwpck_require__) => {

/*
 * @Author: Dorad, ddxi@qq.com
 * @Date: 2023-04-18 22:07:58 +02:00
 * @LastEditors: Dorad, ddxi@qq.com
 * @LastEditTime: 2023-04-19 18:59:22 +02:00
 * @FilePath: \src\customTransformer.js
 * @Description: 
 * 
 * Copyright (c) 2023 by Dorad (ddxi@qq.com), All Rights Reserved.
 */

const axios = __nccwpck_require__(663);
const cheerio = __nccwpck_require__(715);


function capitalizeFirstLetter(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}

function getUrlFromFileOrExternalBlock(block, embed_type = "audio") {
    type = capitalizeFirstLetter(embed_type.toLowerCase());
    if (!block) {
        console.error(`${type} block is null: `, block);
        return false;
    }
    if (block.type === "file" && block.file?.url) {
        console.warn(`${type} block with file type: ${block.type}, it's a temporary link which will expire soon.`);
        return block.file?.url;
    } else if (block.type === "external" && block.external.url) {
        return block.external?.url;
    } else {
        console.error(`${type} block with unsupported type: `, block.type);
        return false;
    }
}

var CAPTION_DIV_TEMPLATE = `<div style="text-align: center; margin:0;"><p>{{caption}}</p></div>`;
/**
 * to parse the link preview block
 * @param {*} block 
 * @returns 
 */
async function link_preview(block) {
    const { link_preview } = block;
    if (!link_preview) return false;
    if (!link_preview.url) {
        console.error("Link preview block without url: ", block);
        return false;
    }
    const url = link_preview.url;
    // fetch the link preview
    try {
        switch (new URL(url).hostname) {
            case "github.com":
                return await _link_preview_github(url);
            default:
                console.error("Link preview block with unsupported domain: ", block);
                return false;
        }
    } catch (err) {
        // check if it's the error from axios
        if (axios.isAxiosError(err)) {
            console.error(`Failed to query from ${err.config.url}, status: ${err.response.status}, msg: ${err.response.data}`);
        } else {
            // err.response.data
            console.error("Error parsing link preview block: ", block, err);
        }
        return false;
    }
}

/**
 * 
 * @param {string} url 
 * @returns 
 */

async function _link_preview_github(url) {
    /**
     * url example: 
     * https://github.com/Doradx, home page
     * https://github.com/Doradx/CNKI-PDF-RIS-Helper, repo page
     * https://github.com/Doradx/CNKI-PDF-RIS-Helper/issues, issues list page
     * https://github.com/Doradx/CNKI-PDF-RIS-Helper/issues/2, issue page
     * https://github.com/Doradx/CNKI-PDF-RIS-Helper/pulls, pull requests list page
     * https://github.com/dpy1123/GithubRemark/pull/4, pull request page
     */
    const path = new URL(url).pathname.split("/").filter((x) => x);
    const HTML_TEMPLATE = `<div style="margin:5px 1px;"> <a href="{{url}}" target="_blank" rel="noopener noreferrer" style="display:flex;color:inherit;background:#f5f5f5;text-decoration:none;user-select:none;transition:background 20ms ease-in 0s;cursor:pointer;flex-grow:1;min-width:0;align-items:center;border:1px solid rgba(55,53,47,.16);border-radius:5px;padding:6px;fill:inherit"><div style="display:flex;align-self:start;height:32px;width:32px;margin:3px 12px 3px 4px;position:relative"><div><div style="width:100%;height:100%"><img src="{{avatar}}" referrerpolicy="same-origin" style="display:block;object-fit:cover;border-radius:34px;width:30.192px;height:30.192px;transition:opacity .1s ease-out 0s;box-shadow:rgba(15,15,15,.1) 0 2px 4px"></div></div><div style="position:absolute;bottom:-2px;right:-2px"><div style="width:100%;height:100%"><svg xmlns="http://www.w3.org/2000/svg" viewbox="0 0 496 512" style="display:block;object-fit:cover;border-radius:5px;width:14.208px;height:14.208px;transition:opacity .1s ease-out 0s;filter:drop-shadow(white 0 0 1px) drop-shadow(white 0 0 1px) drop-shadow(white 0 0 1px)"><path d="M165.9 397.4c0 2-2.3 3.6-5.2 3.6-3.3.3-5.6-1.3-5.6-3.6 0-2 2.3-3.6 5.2-3.6 3-.3 5.6 1.3 5.6 3.6zm-31.1-4.5c-.7 2 1.3 4.3 4.3 4.9 2.6 1 5.6 0 6.2-2s-1.3-4.3-4.3-5.2c-2.6-.7-5.5.3-6.2 2.3zm44.2-1.7c-2.9.7-4.9 2.6-4.6 4.9.3 2 2.9 3.3 5.9 2.6 2.9-.7 4.9-2.6 4.6-4.6-.3-1.9-3-3.2-5.9-2.9zM244.8 8C106.1 8 0 113.3 0 252c0 110.9 69.8 205.8 169.5 239.2 12.8 2.3 17.3-5.6 17.3-12.1 0-6.2-.3-40.4-.3-61.4 0 0-70 15-84.7-29.8 0 0-11.4-29.1-27.8-36.6 0 0-22.9-15.7 1.6-15.4 0 0 24.9 2 38.6 25.8 21.9 38.6 58.6 27.5 72.9 20.9 2.3-16 8.8-27.1 16-33.7-55.9-6.2-112.3-14.3-112.3-110.5 0-27.5 7.6-41.3 23.6-58.9-2.6-6.5-11.1-33.3 2.6-67.9 20.9-6.5 69 27 69 27 20-5.6 41.5-8.5 62.8-8.5s42.8 2.9 62.8 8.5c0 0 48.1-33.6 69-27 13.7 34.7 5.2 61.4 2.6 67.9 16 17.7 25.8 31.5 25.8 58.9 0 96.5-58.9 104.2-114.8 110.5 9.2 7.9 17 22.9 17 46.4 0 33.7-.3 75.4-.3 83.6 0 6.5 4.6 14.4 17.3 12.1C428.2 457.8 496 362.9 496 252 496 113.3 383.5 8 244.8 8zM97.2 352.9c-1.3 1-1 3.3.7 5.2 1.6 1.6 3.9 2.3 5.2 1 1.3-1 1-3.3-.7-5.2-1.6-1.6-3.9-2.3-5.2-1zm-10.8-8.1c-.7 1.3.3 2.9 2.3 3.9 1.6 1 3.6.7 4.3-.7.7-1.3-.3-2.9-2.3-3.9-2-.6-3.6-.3-4.3.7zm32.4 35.6c-1.6 1.3-1 4.3 1.3 6.2 2.3 2.3 5.2 2.6 6.5 1 1.3-1.3.7-4.3-1.3-6.2-2.2-2.3-5.2-2.6-6.5-1zm-11.4-14.7c-1.6 1-1.6 3.6 0 5.9 1.6 2.3 4.3 3.3 5.6 2.3 1.6-1.3 1.6-3.9 0-6.2-1.4-2.3-4-3.3-5.6-2z"></path></svg></div></div></div><div style="display:flex;flex-direction:column;justify-content:center;flex-grow:1;flex-shrink:1;overflow:hidden"><div style="display:flex;align-items:baseline;font-size:14px"><div spellcheck="false" style="white-space:nowrap;color:#37352f;font-weight:500;overflow:hidden;text-overflow:ellipsis">{{title}}</div></div><div style="display:flex;align-items:center;color:rgba(55,53,47,.65);font-size:12px"><div spellcheck="false" style="white-space:nowrap;color:rgba(55,53,47,.65)">{{owner}}</div><span style="margin-left:3px;margin-right:3px">•</span><div style="color:rgba(55,53,47,.65);font-size:12px;white-space:nowrap">{{remark}}</div></div></div><div role="button" tabindex="0" style="user-select:none;transition:background 20ms ease-in 0s;cursor:pointer;opacity:0;display:flex;align-items:center;justify-content:center;width:28px;height:28px;border-radius:5px;flex-shrink:0;margin-right:4px;color:rgba(55,53,47,.65)"><svg viewbox="0 0 13 3" class="dots" style="width:14px;height:100%;display:block;fill:inherit;flex-shrink:0;backface-visibility:hidden;color:rgba(55,53,47,.45)"><g><path d="M3,1.5A1.5,1.5,0,1,1,1.5,0,1.5,1.5,0,0,1,3,1.5Z"></path><path d="M8,1.5A1.5,1.5,0,1,1,6.5,0,1.5,1.5,0,0,1,8,1.5Z"></path><path d="M13,1.5A1.5,1.5,0,1,1,11.5,0,1.5,1.5,0,0,1,13,1.5Z"></path></g></svg></div></a></div>`;
    var data = {
        title: "",
        owner: "",
        remark: "",
        avatar: "",
        state_icon: "",
        url: url
    }
    if (path.length < 2) {
        console.error("Link preview block with unsupported url: ", url);
        return false;
    } else if (path.length == 2) {
        // home page
        const info = await axios.get(`https://api.github.com/repos/${path[0]}/${path[1]}`).then((res) => res.data);
        data.title = info.full_name;
        data.avatar = info.owner.avatar_url;
        data.owner = info.owner.login;
        data.remark = "Created: " + info.created_at;
    } else if (path.length == 3) {
        // pulls/issues/actions, pull home page info and add "pulls" or "issues"
        const info = await axios.get(`https://api.github.com/repos/${path[0]}/${path[1]}`).then((res) => res.data);
        data.title = info.full_name + "  " + capitalizeFirstLetter(path[2]);
        data.avatar = info.owner.avatar_url;
        data.owner = info.owner.login;
        data.remark = "Created: " + info.created_at;
    } else if (path.length == 4) {
        // pull/issue
        let req_url = "";
        if (path[2] == "issues") {
            // issue detail
            req_url = `https://api.github.com/repos/${path[0]}/${path[1]}/issues/${path[3]}`;
        } else if (path[2] == "pull") {
            req_url = `https://api.github.com/repos/${path[0]}/${path[1]}/pulls/${path[3]}`
        } else {
            console.error("Link preview block with unsupported url: ", url);
        }
        if (!req_url) return false;
        const info = await axios.get(req_url).then((res) => res.data);
        // add icon, state according to issue/pull state
        var STATE_SVG = {
            pull: {
                opened: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" width="12.5" height="12.5"><path d="M1.5 3.25a2.25 2.25 0 1 1 3 2.122v5.256a2.251 2.251 0 1 1-1.5 0V5.372A2.25 2.25 0 0 1 1.5 3.25Zm5.677-.177L9.573.677A.25.25 0 0 1 10 .854V2.5h1A2.5 2.5 0 0 1 13.5 5v5.628a2.251 2.251 0 1 1-1.5 0V5a1 1 0 0 0-1-1h-1v1.646a.25.25 0 0 1-.427.177L7.177 3.427a.25.25 0 0 1 0-.354ZM3.75 2.5a.75.75 0 1 0 0 1.5.75.75 0 0 0 0-1.5Zm0 9.5a.75.75 0 1 0 0 1.5.75.75 0 0 0 0-1.5Zm8.25.75a.75.75 0 1 0 1.5 0 .75.75 0 0 0-1.5 0Z"></path></svg>`,
                merged: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" width="12.5" height="12.5"><path d="M5.45 5.154A4.25 4.25 0 0 0 9.25 7.5h1.378a2.251 2.251 0 1 1 0 1.5H9.25A5.734 5.734 0 0 1 5 7.123v3.505a2.25 2.25 0 1 1-1.5 0V5.372a2.25 2.25 0 1 1 1.95-.218ZM4.25 13.5a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Zm8.5-4.5a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5ZM5 3.25a.75.75 0 1 0 0 .005V3.25Z"></path></svg>`,
                colsed: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" width="12.5" height="12.5"><path d="M3.25 1A2.25 2.25 0 0 1 4 5.372v5.256a2.251 2.251 0 1 1-1.5 0V5.372A2.251 2.251 0 0 1 3.25 1Zm9.5 5.5a.75.75 0 0 1 .75.75v3.378a2.251 2.251 0 1 1-1.5 0V7.25a.75.75 0 0 1 .75-.75Zm-2.03-5.273a.75.75 0 0 1 1.06 0l.97.97.97-.97a.748.748 0 0 1 1.265.332.75.75 0 0 1-.205.729l-.97.97.97.97a.751.751 0 0 1-.018 1.042.751.751 0 0 1-1.042.018l-.97-.97-.97.97a.749.749 0 0 1-1.275-.326.749.749 0 0 1 .215-.734l.97-.97-.97-.97a.75.75 0 0 1 0-1.06ZM2.5 3.25a.75.75 0 1 0 1.5 0 .75.75 0 0 0-1.5 0ZM3.25 12a.75.75 0 1 0 0 1.5.75.75 0 0 0 0-1.5Zm9.5 0a.75.75 0 1 0 0 1.5.75.75 0 0 0 0-1.5Z"></path></svg>`,
                draft: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" width="12.5" height="12.5"><path d="M3.25 1A2.25 2.25 0 0 1 4 5.372v5.256a2.251 2.251 0 1 1-1.5 0V5.372A2.251 2.251 0 0 1 3.25 1Zm9.5 14a2.25 2.25 0 1 1 0-4.5 2.25 2.25 0 0 1 0 4.5ZM2.5 3.25a.75.75 0 1 0 1.5 0 .75.75 0 0 0-1.5 0ZM3.25 12a.75.75 0 1 0 0 1.5.75.75 0 0 0 0-1.5Zm9.5 0a.75.75 0 1 0 0 1.5.75.75 0 0 0 0-1.5ZM14 7.5a1.25 1.25 0 1 1-2.5 0 1.25 1.25 0 0 1 2.5 0Zm0-4.25a1.25 1.25 0 1 1-2.5 0 1.25 1.25 0 0 1 2.5 0Z"></path></svg>`
            },
            issue: {
                opened: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" width="12.5" height="12.5"><path d="M8 9.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Z"></path><path d="M8 0a8 8 0 1 1 0 16A8 8 0 0 1 8 0ZM1.5 8a6.5 6.5 0 1 0 13 0 6.5 6.5 0 0 0-13 0Z"></path></svg>`,
                closed: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" width="12.5" height="12.5"><path d="M11.28 6.78a.75.75 0 0 0-1.06-1.06L7.25 8.69 5.78 7.22a.75.75 0 0 0-1.06 1.06l2 2a.75.75 0 0 0 1.06 0l3.5-3.5Z"></path><path d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0Zm-1.5 0a6.5 6.5 0 1 0-13 0 6.5 6.5 0 0 0 13 0Z"></path></svg>`,
                draft: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" width="12.5" height="12.5"><path d="M14.307 11.655a.75.75 0 0 1 .165 1.048 8.05 8.05 0 0 1-1.769 1.77.75.75 0 0 1-.883-1.214 6.552 6.552 0 0 0 1.44-1.439.75.75 0 0 1 1.047-.165Zm-2.652-9.962a.75.75 0 0 1 1.048-.165 8.05 8.05 0 0 1 1.77 1.769.75.75 0 0 1-1.214.883 6.552 6.552 0 0 0-1.439-1.44.75.75 0 0 1-.165-1.047ZM6.749.097a8.074 8.074 0 0 1 2.502 0 .75.75 0 1 1-.233 1.482 6.558 6.558 0 0 0-2.036 0A.751.751 0 0 1 6.749.097ZM.955 6.125a.75.75 0 0 1 .624.857 6.558 6.558 0 0 0 0 2.036.75.75 0 1 1-1.482.233 8.074 8.074 0 0 1 0-2.502.75.75 0 0 1 .858-.624Zm14.09 0a.75.75 0 0 1 .858.624c.13.829.13 1.673 0 2.502a.75.75 0 1 1-1.482-.233 6.558 6.558 0 0 0 0-2.036.75.75 0 0 1 .624-.857Zm-8.92 8.92a.75.75 0 0 1 .857-.624 6.558 6.558 0 0 0 2.036 0 .75.75 0 1 1 .233 1.482c-.829.13-1.673.13-2.502 0a.75.75 0 0 1-.624-.858Zm-4.432-3.39a.75.75 0 0 1 1.048.165 6.552 6.552 0 0 0 1.439 1.44.751.751 0 0 1-.883 1.212 8.05 8.05 0 0 1-1.77-1.769.75.75 0 0 1 .166-1.048Zm2.652-9.962A.75.75 0 0 1 4.18 2.74a6.556 6.556 0 0 0-1.44 1.44.751.751 0 0 1-1.212-.883 8.05 8.05 0 0 1 1.769-1.77.75.75 0 0 1 1.048.166Z"></path></svg>`, // 草稿
                reopened: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" width="12.5" height="12.5"><path d="M5.029 2.217a6.5 6.5 0 0 1 9.437 5.11.75.75 0 1 0 1.492-.154 8 8 0 0 0-14.315-4.03L.427 1.927A.25.25 0 0 0 0 2.104V5.75A.25.25 0 0 0 .25 6h3.646a.25.25 0 0 0 .177-.427L2.715 4.215a6.491 6.491 0 0 1 2.314-1.998ZM1.262 8.169a.75.75 0 0 0-1.22.658 8.001 8.001 0 0 0 14.315 4.03l1.216 1.216a.25.25 0 0 0 .427-.177V10.25a.25.25 0 0 0-.25-.25h-3.646a.25.25 0 0 0-.177.427l1.358 1.358a6.501 6.501 0 0 1-11.751-3.11.75.75 0 0 0-.272-.506Z"></path><path d="M9.06 9.06a1.5 1.5 0 1 1-2.12-2.12 1.5 1.5 0 0 1 2.12 2.12Z"></path></svg>`, // 重新打开
            }
        };
        if (path[2] === "pull") {
            if (info.draft) data.state_icon = STATE_SVG.pull.draft;
            else if (info.state === "open") data.state_icon = STATE_SVG.pull.opened;
            else if (info.state === "merged") data.state_icon = STATE_SVG.pull.merged;
            else if (info.state === "closed") data.state_icon = STATE_SVG.pull.closed;
        } else {
            if (info.draft) data.state_icon = STATE_SVG.issue.draft;
            else if (info.state_reason === "reopened") data.state_icon = STATE_SVG.issue.reopened;
            else if (info.state === "open") data.state_icon = STATE_SVG.issue.opened;
            else if (info.state === "closed") data.state_icon = STATE_SVG.issue.closed;
        }
        if (data.state_icon) data.state_icon = `${data.state_icon} #${info.number}<span style="margin-left:3px;margin-right:3px">•</span>`;
        // type: path[2], state: from info.state
        data.title = info.title + " " + (data.state_icon ? data.state_icon : "") + capitalizeFirstLetter(info.state);  // 图标, 状态
        data.avatar = info.user.avatar_url;
        data.owner = data.state_icon ? data.state_icon + info.user.login : info.user.login;
        // 添加图标, ID, username
        data.remark = "Created: " + info.created_at;
    } else {
        console.error("Link preview block with unsupported url: ", url);
        return false;
    }
    return HTML_TEMPLATE.replace(/\{\{(.*?)\}\}/g, (match, key) => data[key]);
}

async function bookmark(block) {
    const { bookmark, author } = block;
    if (!bookmark?.url) return "";
    const caption = bookmark.caption && bookmark.caption.length ? bookmark.caption[0].plain_text : "";
    const p = await axios.get(encodeURI(bookmark.url)).then((res) => {
        const $ = cheerio.load(res.data, {
            ignoreWhitespace: true,
            lowerCaseAttributeNames: true,
            lowerCaseTags: true,
        });
        // get title, description, cover, favicon from meta tags, key case is not considered
        const metaTags = $('head').find('meta');
        var metas = {};
        metaTags.each((i, e) => {
            var name = $(e).attr('name') || $(e).attr('property');
            if (name) metas[name.toLowerCase()] = $(e).attr('content');
        });
        const title = metas['og:title'] || metas['twitter:title'] || $('title').text();
        const description = metas['og:description'] || metas['twitter:description'] || metas['description'] || "";
        const cover = metas['og:image'] || metas['twitter:image'] || metas['image'] || "";
        var favicon = $('link[rel="shortcut icon"]').attr('href') || $('link[rel="icon"]').attr('href') || "";
        if (favicon.startsWith("//")) favicon = "https:" + favicon;
        if (favicon.startsWith("/")) favicon = "https://" + new URL(bookmark.url).hostname + favicon;
        return {
            title: title,
            description: description,
            cover: cover,
            favicon: favicon,
            url: bookmark.url,
        }
    })
        .catch((err) => {
            if (axios.isAxiosError(err)) {
                console.warn('Bookmark preview fetch error: ', err.response?.status, err.response?.statusText);

            } else {
                console.warn('Bookmark preview fetch error: ', err);
            }
            return {
                // title is the domain name
                title: new URL(bookmark.url).hostname,
                description: "",
                cover: "",
                favicon: "",
                url: bookmark.url,
            }
        });
    var cover_div = p.cover ? `<div style="flex: 1 1 180px; display: block; position: relative;"><div style="position: absolute; inset: 0px;"><div style="width: 100%; height: 100%;"><img src="${p.cover}" referrerpolicy="no-referrer" style="display: block; object-fit: cover; border-radius: 3px; width: 100%; height: 100%;"></div></div></div>` : "";
    var body_div = `<div style="display: flex; background:white;border-radius:5px"><a href="${p.url}"target="_blank"rel="noopener noreferrer"style="display: flex; color: inherit; text-decoration: none; user-select: none; transition: background 20ms ease-in 0s; cursor: pointer; flex-grow: 1; min-width: 0px; flex-wrap: wrap-reverse; align-items: stretch; text-align: left; overflow: hidden; border: 1px solid rgba(55, 53, 47, 0.16); border-radius: 5px; position: relative; fill: inherit;"><div style="flex: 4 1 180px; padding: 12px 14px 14px; overflow: hidden; text-align: left;"><div style="font-size: 14px; line-height: 20px; color: rgb(55, 53, 47); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; min-height: 24px; margin-bottom: 2px;">${p.title}</div><div style="font-size: 12px; line-height: 16px; color: rgba(55, 53, 47, 0.65); height: 32px; overflow: hidden;">${p.description}</div><div style="display: flex; margin-top: 6px; height: 16px;"><img src="${p.favicon}"style="width: 16px; height: 16px; min-width: 16px; margin-right: 6px;"><div style="font-size: 12px; line-height: 16px; color: rgb(55, 53, 47); white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${p.url}</div></div></div>${cover_div}</a></div>`
    var caption_div = caption ? CAPTION_DIV_TEMPLATE.replace("{{caption}}", caption) : "";
    return `<div style="width: 100%; margin-top: 4px; margin-bottom: 4px;">${body_div}${caption_div}</div>`;
}

/**
 * to parse a pdf block
 * @param {*} block 
 * @returns 
 */

async function pdf(block) {
    const { pdf } = block || {};
    if (!pdf) return false;
    const url = getUrlFromFileOrExternalBlock(pdf, 'pdf');
    if (!url) return false;
    var caption = pdf.caption && pdf.caption.length > 0 ? pdf.caption[0].plain_text : "";
    var iframe = `<iframe src="${url}" style="width: 100%; margin:0; aspect-ratio: 16/9;"></iframe>`;
    const caption_div = caption ? CAPTION_DIV_TEMPLATE.replace("{{caption}}", caption) : "";
    return `<div class="pdf">${iframe}${caption_div}</div>`;
}

async function audio(block) {
    const { audio } = block;
    if (!audio) return false;
    const url = getUrlFromFileOrExternalBlock(audio, 'audio');
    if (!url) return false;
    const caption = audio.caption && audio.caption.length ? audio.caption[0].plain_text : "";
    var audio_div = `<audio controls style="width: 100%; height: 54px;margin:0;"><source src="${url}" type="audio/mpeg"></audio>`;
    var caption_div = caption ? CAPTION_DIV_TEMPLATE.replace("{{caption}}", caption) : "";
    return `<div style="width: 100%; margin: 0 0 2px;">${audio_div}${caption_div}</div>`
}

async function video(block) {
    const { video } = block;
    const url = getUrlFromFileOrExternalBlock(video, 'video');
    if (!url) return false;
    var caption = video.caption && video.caption.length > 0 ? video.caption[0].plain_text : "";
    // fetch the iframe url
    const domain = new URL(url).hostname;
    var vid = false;
    var video_url = "";
    try {
        switch (domain) {
            case "youtu.be":
                vid = new URL(url).pathname.split("/")[1] || false;
            case "m.youtube.com":
            case "www.youtube.com":
                if (!vid) vid = new URL(url).searchParams.get("v") || false;
                if (vid) video_url = `https://www.youtube.com/embed/${vid}`;
                break;
            case "www.bilibili.com":
                vid = new URL(url).pathname.split("/")[2] || false;
                video_url = `//player.bilibili.com/player.html?bvid=${vid}&page=1&autoplay=0`;
                break;
            case "v.qq.com":
                vid = new URL(url).pathname.split("/")[2] || false;
                video_url = `https://v.qq.com/txp/iframe/player.html?vid=${vid}`;
                break;
            default:
                console.error("Video block with unsupported domain: ", domain);
                video_url = url;
        }
    }
    catch (err) {
        console.error("Error parsing video block: ", block);
        return false;
    }
    if (!vid) {
        console.error("Video block without video id: ", block);
        return false;
    }
    const video_div = `<iframe src="${video_url}" scrolling="no" border="0" frameborder="no" framespacing="0" allowfullscreen="true" style="width: 100%; margin:0; aspect-ratio: 16/9;"> </iframe>`;
    var caption_div = caption ? CAPTION_DIV_TEMPLATE.replace("{{caption}}", caption) : "";
    return `<div style="width: 100%; margin-top: 4px; margin-bottom: 4px;">${video_div}${caption_div}</div>`
}

async function embed(block) {
    const { embed } = block;
    if (!embed) return false;
    if (!embed.url) {
        console.error("Embed block without url: ", block);
        return false;
    }
    const caption = embed.caption && embed.caption.length ? embed.caption[0].plain_text : "";
    const url = embed.url;
    var iframe = false;
    try {
        switch (new URL(url).hostname) {
            case "twitter.com":
                try {
                    // get twitter username and status id using regex from status url like: https://twitter.com/engineers_feed/status/1648224909628428288
                    const { username, status_id } = url.match(/twitter\.com\/(?<username>\w+)\/status\/(?<status_id>\d+)/).groups;
                    // query twitter embed code from twitter
                    const data = await axios.get(`https://publish.twitter.com/oembed?url=https://twitter.com/${username}/status/${status_id}`).then((resp) => resp.data);
                    iframe = data.html;
                } catch (err) {
                    console.error(`Error fetching twitter embed code: ${err}, url: ${url}`);
                    return false;
                }
                break;
            case "www.google.com":
                // check if the url is embed
                if (!url.includes("embed")) {
                    console.error("Embed block with unsupported google url: ", url);
                    return false;
                }
                iframe = `<iframe src="${url}" style="width: 100%; margin:0; aspect-ratio: 16/9;" allowfullscreen="" loading="lazy" referrerpolicy="no-referrer-when-downgrade"></iframe>`;
                break;
            default:
                console.warn("Embed block with unsupported domain, url: ", url);
                iframe = `<iframe src="${url}" style="width: 100%; margin:0; aspect-ratio: 16/9;" allowfullscreen="" loading="lazy" referrerpolicy="no-referrer-when-downgrade"></iframe>`
        }
    } catch (err) {
        console.error("Error parsing embed block: ", block, err);
        return false;
    }
    if (!iframe) {
        console.error("Embed block without iframe: ", block, err);
        return false;
    }
    var caption_div = caption ? CAPTION_DIV_TEMPLATE.replace("{{caption}}", caption) : "";
    return `<div style="width: 100%; margin: 0 0 2px;">${iframe}${caption_div}</div>`
}

module.exports = {
    bookmark,
    link_preview,
    video,
    audio,
    embed,
    pdf
}

/***/ }),

/***/ 97:
/***/ ((module, __unused_webpack_exports, __nccwpck_require__) => {

const Migrater = __nccwpck_require__(634);
const FileHandler = __nccwpck_require__(665);
const crypto = __nccwpck_require__(113);
const axios = __nccwpck_require__(663);

const fs = __nccwpck_require__(147);
const path = __nccwpck_require__(17);
const os = __nccwpck_require__(37);

const imagemin = __nccwpck_require__(506);
const imageSize = __nccwpck_require__(436);
const imageminPngquant = __nccwpck_require__(210);
const imageminMozjpeg = __nccwpck_require__(87);
const imageminGifsicle = __nccwpck_require__(181);
const imageminSvgo = __nccwpck_require__(96);


async function checkPicExist(picUrl) {
  try {
    const res = await axios.head(picUrl);
    return res.status === 200;
  } catch (e) {
    return false;
  }
}

async function compressPic(item) {
  return imagemin.buffer(item.buffer, {
    plugins: [
      imageminPngquant(),
      imageminMozjpeg(),
      imageminGifsicle(),
      imageminSvgo()
    ],
  }).then((newBuffer) => {
    const { width, height } = imageSize(newBuffer);
    item.buffer = newBuffer;
    item.width = width;
    item.height = height;
    // item.fileName = `${crypto.createHash("md5").update(newBuffer).digest("hex")}${item.extname}`;
    // update the buffer
    console.log(`Compress image ${item.fileName} success`);
    return item;
  });
}

async function checkPicUrlList(picUrlList) {
  return Promise.all(picUrlList.map(async (url) => {
    const exists = await checkPicExist(url);
    if (exists) {
      return url;
    }
    else {
      return false;
    }
  }));
}

class NotionMigrater extends Migrater.default {
  async getPicFromURL(url) {
    return this.ctx.request({
      url,
      encoding: null,
      responseType: "arraybuffer",
    });
  }

  async handlePicFromURL(url) {
    try {
      if (url.includes("data:image/svg+xml")) {
        let data = url.replace("data:image/svg+xml;utf8,", "");
        return {
          buffer: Buffer.from(decodeURIComponent(data), "utf-8"),
          fileName: `${new Date().getTime()}.svg`,
          extname: ".svg",
          origin: url,
        };
      }
      return super.handlePicFromURL(url);
    } catch (e) {
      this.ctx.log.error(`get pic from url fail: ${e}`);
      return undefined;
    }
  }

  async migrate() {
    const originTransformer = this.ctx.getConfig('picBed.transformer') || null;
    this.ctx.setConfig({
      'picBed.transformer': 'base64'
    });
    this.ctx.output = []; // a bug before picgo v1.2.2
    const include = this.ctx.getConfig('picgo-plugin-pic-migrater.include') || null;
    const exclude = this.ctx.getConfig('picgo-plugin-pic-migrater.exclude') || null;
    const base_url = this.ctx.getConfig('pic-base-url') || null;
    const includesReg = new RegExp(include);
    const excludesReg = new RegExp(exclude);
    if (!this.urlArray || this.urlArray.length === 0) {
      return {
        urls: [],
        success: 0,
        exists: 0,
        total: 0,
      };
    }
    var existsImgsList = [];
    var successImgsList = [];
    // filter the url using include and exclude
    var toUploadURLs = this.urlArray.filter(url => ((!include || includesReg.test(url)) && (!exclude || !excludesReg.test(url))));
    var ToProcessURLs = toUploadURLs.length;
    console.log(`Total ${toUploadURLs.length} images to upload.`);
    // check the url if it is already uploaded, if base_url is set
    if (base_url) {
      // filter the url include uuid and extname, to check the existence
      const uuidreg = /[a-fA-F0-9]{8}-(?:[a-fA-F0-9]{4}-){3}[a-fA-F0-9]{12}/;
      const toCheckURLs = toUploadURLs.filter(url => {
        const id = uuidreg.exec(url)?.[0];
        var extname = url.split('?')[0].split('.').pop()?.toLowerCase();
        return id && extname;
      });
      const existsImgs = await checkPicUrlList(toCheckURLs.map(url => {
        const id = uuidreg.exec(url)?.[0];
        var extname = url.split('?')[0].split('.').pop()?.toLowerCase();
        return `${base_url}${id}.${extname}`;
      }));
      await existsImgs.forEach((exists, index) => {
        if (exists) {
          existsImgsList.push({
            original: toUploadURLs[index],
            new: `${exists}`
          });
          console.log(`Image ${exists} already exists, skip`);
        }
      });
      // remove the exists image from the toUploadURLs
      toUploadURLs = await toUploadURLs.filter(url => !existsImgsList.find(item => item.original === url));
    }
    /** 
     * 采用队列进行图片上传，防止图片过多的时候，资源占用过多
    */
    // the queue
    const queue = new (await __nccwpck_require__.e(/* import() */ 413).then(__nccwpck_require__.t.bind(__nccwpck_require__, 413, 23))).default({ concurrency: 20 })
    // the queue task function
    const queueTask = async (url) => {
      let imgInfo;
      try {
        const picPath = this.getLocalPath(url);
        if (!picPath) {
          imgInfo = await this.handlePicFromURL(url);
          // get pic uuid from the url using regex
          const uuidreg = /[a-fA-F0-9]{8}-(?:[a-fA-F0-9]{4}-){3}[a-fA-F0-9]{12}/;
          const id = uuidreg.exec(url)?.[0];
          var extname = url.split('?')[0].split('.').pop()?.toLowerCase();
          // if the url is a notion url
          if (id && extname) {
            // 文件重命名为notion url中的id
            imgInfo.extname = '.' + extname;
            imgInfo.uuid = id;
            imgInfo.fileName = `${imgInfo.uuid}${imgInfo.extname}`;
          }
        }
        else {
          imgInfo = await this.handlePicFromLocal(picPath, url);
        }
      } catch (e) {
        this.ctx.log.error(`get pic from url fail: ${e}`);
        return;
      }

      // compress the image
      if (this.ctx.getConfig('compress')) {
        imgInfo = await compressPic(imgInfo);
      }
      // upload the image
      const result = await this.ctx.upload([imgInfo]);
      if (result && result[0] && result[0].imgUrl) {
        successImgsList.push({
          original: imgInfo.origin,
          new: result[0].imgUrl
        });
        console.log(`Upload image ${imgInfo.fileName} success`);
      }
      else {
        console.log(`Upload image ${imgInfo.fileName} fail`);
      }
    };
    toUploadURLs.forEach(url => {
      queue.add(() => queueTask(url))
    })
    // wait for the queue to be empty
    await queue.onIdle();
    // generate the result
    console.log('===============================')
    console.log(`Total ${existsImgsList.length} / ${ToProcessURLs} images already exists`);
    console.log(`Total ${successImgsList.length} / ${ToProcessURLs} images upload success, list: ${successImgsList.map(item => item.new).join(', ')}`);
    console.log('===============================')
    return {
      urls: existsImgsList.concat(successImgsList),
      success: successImgsList.length + existsImgsList.length,
      exists: existsImgsList.length,
      total: ToProcessURLs
    };
  }
}

class NotionFileHandler extends FileHandler.default {
  getUrlListFromFileContent(file) {
    const content = this.fileList[file] || "";
    const markdownURLList = (content.match(/\!\[.*\]\(.*\)/g) || [])
      .map((item) => {
        const res = item.match(/\!\[.*\]\((.*?)( ".*")?\)/);
        if (res) {
          return res[1];
        }
        return null;
      })
      .filter((item) => item);

    const imageTagURLList = (content.match(/<img.*?(?:>|\/>)/gi) || [])
      .map((item) => {
        const res = item.match(/src=[\'\"]?(.*?)[\'\"]/i);
        if (res) return res[1];
        return null;
      })
      .filter((item) => item);

    let urls = markdownURLList.concat(imageTagURLList);

    // front matter
    let matchs = content.matchAll(/(.*):\s((https?:\/\/.*\.(?:png|jpe?g|gif|svg|tiff?|webp|bmp)).*)/gi);
    for (const m of matchs) {
      let src = m[2];
      src = src.replace(/^'/, "").replace(/'$/, "");
      src = src.replace(/^"/, "").replace(/"$/, "");
      src = src.trim();
      if (!src) continue;
      urls.push(src);
    }

    this.urlList[file] = {};
    for (const url of urls) {
      this.urlList[file][url] = url;
    }
    console.log(`file: ${file}, urls: ${urls}`); 
  }
}

async function migrate(ctx, files) {
  ctx.log.info("Migrating...");

  let total = 0;
  let success = 0;

  for (const file of files) {
    const fileHandler = new NotionFileHandler(ctx);
    // read File
    fileHandler.read(file);
    const migrater = new NotionMigrater(ctx, null, file);
    migrater.init(fileHandler.getFileUrlList(file));

    // migrate pics
    const result = await migrater.migrate();

    if (result.total === 0) continue;

    total += result.total;
    success += result.success;
    if (result.success === 0) {
      ctx.log.warn(
        `Please check your configuration, since no images migrated successfully in ${file}`
      );
      return;
    }
    let content = fileHandler.getFileContent(file);
    // replace content
    result.urls.forEach((item) => {
      content = content.replaceAll(item.original, item.new);
    });
    fileHandler.write(file, content, "", true);
  }
  return { total, success };
}

module.exports = migrate;


/***/ }),

/***/ 630:
/***/ ((module, __unused_webpack_exports, __nccwpck_require__) => {

/*
 * @Author: Dorad, ddxi@qq.com
 * @Date: 2023-04-12 18:38:51 +02:00
 * @LastEditors: Dorad, ddxi@qq.com
 * @LastEditTime: 2023-09-02 11:13:18 +08:00
 * @FilePath: \src\notion.js
 * @Description: 
 * 
 * Copyright (c) 2023 by Dorad (ddxi@qq.com), All Rights Reserved.
 */
const { Client } = __nccwpck_require__(793);
const { writeFileSync, existsSync, mkdirSync, readFileSync, readdirSync, unlinkSync } = __nccwpck_require__(147);
const { NotionToMarkdown } = __nccwpck_require__(471);
const { parse } = __nccwpck_require__(109);
const { getBlockChildren } = __nccwpck_require__(309);
const YAML = __nccwpck_require__(899);
const { PicGo } = __nccwpck_require__(863);
const path = __nccwpck_require__(17);
const Migrater = __nccwpck_require__(97);
const { format } = __nccwpck_require__(324);
const moment = __nccwpck_require__(737);
const t = __nccwpck_require__(451);

let config = {
  notion_secret: "",
  database_id: "",
  migrate_image: true,
  picBed: { uploader: "tcyun", current: "tcyun", tcyun: {}, aliyun: {} },
  status: {
    name: "",
    unpublish: "",
    published: "",
  },
  output_dir: {
    page: "",
    post: "",
    clean_unpublished_post: true,
  },
  timezone: "Asia/Shanghai",
  pic_base_url: "",
  pic_compress: false,
};

let notion = new Client({ auth: config.notion_secret });
let picgo = new PicGo();
let n2m = new NotionToMarkdown({ notionClient: notion });

function init(conf) {
  config = conf;
  notion = new Client({
    auth: config.notion_secret,
    config: {
      separateChildPage: true, // default: false
    }
  });

  const domain = new URL(config.pic_base_url).hostname;

  let picgo_config = {
    "picBed": config.picBed,
    "picgo-plugin-pic-migrater": {
      // only include notion image
      include: `^(https://.*?amazonaws\.com\/.+\.(?:jpg|jpeg|png|gif|webp)\?.+)`, 
      exclude: `^(?=.*${domain.replace('.', '\.')}).*|.*\.ico$`, // exclude the domain and icon
    },
    "pic-base-url": config.pic_base_url || null
  }

  picgo_config["compress"] = config.pic_compress ? true : false;

  picgo.setConfig(picgo_config);

  // passing notion client to the option
  n2m = new NotionToMarkdown({ notionClient: notion });
  n2m.setCustomTransformer("callout", callout(n2m));
  n2m.setCustomTransformer("bookmark", t.bookmark);
  n2m.setCustomTransformer("video", t.video);
  n2m.setCustomTransformer("embed", t.embed);
  n2m.setCustomTransformer("link_preview", t.link_preview);
  n2m.setCustomTransformer("pdf", t.pdf);
  n2m.setCustomTransformer("audio", t.audio);
}

async function sync() {
  // 获取待发布和已发布的文章
  let pages = await getPages(config.database_id, ["unpublish", "published"]);
  /**
   * 需要处理的逻辑:
   * 1. 对于已发布的文章，如果本地文件存在，且存在abbrlink，则更新notion中的abbrlink
   * 2. 对于未发布的文章, 如果本地文件存在，则尝试读取本地文件的abbrlink，如果存在，则更新notion中的abbrlink, 并生成markdown文件
   * 3. 对于本地存在的文章，如果notion中不是已发布状态，则删除本地文件
   */
  // get all the output markdown filename list of the pages, and remove the file not exists in the pages under the output directory
  // query the filename list from the output directory
  const notionPagePropList = await Promise.all(pages.map(async (page) => {
    var properties = await getPropertiesDict(page);
    switch (properties.type) {
      case "page":
        if (!properties.filename) {
          console.error(`Page ${properties.title} has no filename, the page id will be used as the filename.`);
          properties.filename = properties.id;
        }
        properties.filePath = path.join(config.output_dir.page, properties.filename, 'index.md');
        properties.filename = "index.md";
        break;
      case "post":
      default:
        properties.filename = properties.filename != undefined && properties.filename ? properties.filename + ".md" : properties.title + ".md";
        // get the filename and directory of the post, if the filename includes /, then it will be treated as a subdirectory
        properties.filePath = path.join(config.output_dir.post, properties.filename);
        if (properties.filename.includes("/")) {
          properties.filename = properties.filename.split("/").pop();
        }
    }
    properties.output_dir = path.dirname(properties.filePath);
    return properties;
  }));
  console.log(`${notionPagePropList.length} pages found in notion.`);
  // make the output directory if it is not exists
  if (!existsSync(config.output_dir.post)) {
    mkdirSync(config.output_dir.post, { recursive: true });
  }
  if (!existsSync(config.output_dir.page)) {
    mkdirSync(config.output_dir.page, { recursive: true });
  }
  /**
   * 1. 删除本地存在，但是Notion中不是已发布状态的文章
   * 2. 更新notion中已发布的文章的abbrlink
   *  */
  // load page properties from the markdown file
  const localPostFileList = readdirSync(config.output_dir.post);
  var deletedPostList = [];
  for (let i = 0; i < localPostFileList.length; i++) {
    const file = localPostFileList[i];
    if (!file.endsWith(".md")) {
      continue;
    }
    var localProp = loadPropertiesAndContentFromMarkdownFile(path.join(config.output_dir.post, file));
    if (!localProp) {
      continue;
    }
    var page = pages.find((page) => page.id == localProp.id);
    // if the page is not exists, delete the local file
    if (!page && config.output_dir.clean_unpublished_post) {
      console.log(`Page is not exists, delete the local file: ${file}`);
      unlinkSync(path.join(config.output_dir.post, file));
      deletedPostList.push(file);
      continue;
    }
    // if the page is exists, update the abbrlink of the page if it is empty and the local file has the abbrlink
    var notionProp = notionPagePropList.find((prop) => prop.id == page.id);
    if (localProp.abbrlink && page.properties.hasOwnProperty('abbrlink') && !notionProp.abbrlink) {
      console.log(`Update the abbrlink of the page: ${notionProp.id}, ${notionProp.title}`);
      const abbrlink = localProp.abbrlink;
      const text = {
        "type": "text",
        "text": {
          "content": abbrlink,
          "link": null
        },
        "plain_text": abbrlink,
        "href": null
      };
      page.properties.abbrlink.rich_text.push(text);
    };
  }
  /**
   * 更新未发布的文章
   */
  // deal with notionPagePropList
  if (notionPagePropList.length == 0) {
    console.log("No page to deal with.");
    return;
  }
  // 同步处理文章, 提高速度
  const results = await Promise.all(notionPagePropList.map(async (prop) => {
    let page = pages.find((page) => page.id == prop.id);
    console.log(`Handle page: ${prop.id}, ${prop.title}`);
    /**
     * 只处理未发布的文章
     */
    // skip the page if it is not exists or published
    if (!page || prop[config.status.name] == config.status.published) {
      console.log(`Page is not exists or published, skip: ${prop.id}, ${prop.title}`);
      return false;
    }
    /**
     * 对于已发布的文章，如果本地文件存在，且存在abbrlink，则更新notion中的abbrlink
     */
    // check if the local file exists
    if (!existsSync(prop.filePath)) {
      // the local file is not exists
      console.log(`File ${prop.filePath} is not exists, it's a new page.`);
    }
    // check the output directory, if the file is not exists, create it
    if (!existsSync(prop.output_dir)) {
      mkdirSync(prop.output_dir, { recursive: true });
    }
    // update the page status to published
    if (prop[config.status.name] == config.status.unpublish) {
      page.properties[config.status.name].select = { name: config.status.published };
    }
    // get the latest properties of the page
    const newPageProp = await getPropertiesDict(page);
    await page2Markdown(page, prop.filePath, newPageProp);
    if (config.migrate_image) {
      const res = await migrateImages(prop.filePath);
      if (!res) {
        console.warn(`Migrate images failed: ${prop.id}, ${prop.title}`);
        return false;
      }
    }
    // update the page status to published
    await updatePageProperties(page);
    console.log(`Page conversion successfully: ${prop.id}, ${prop.title}`);
    return true;
  }));
  console.log(`All pages are handled, ${notionPagePropList.length} pages are handled, ${results.filter((r) => r).length} pages are published, ${deletedPostList.length} pages are deleted.`);
}

/**
 * featch page from notion, and convert it to local markdown file
 * @param {*} page 
 * @param {*} filePath 
 * @param {*} properties 
 */

async function page2Markdown(page, filePath, properties) {
  const mdblocks = await n2m.pageToMarkdown(page.id);
  let md = n2m.toMarkdownString(mdblocks).parent;
  fm = YAML.stringify(properties, { doubleQuotedAsJSON: true });
  // check if the file already exists
  md = format(`---\n${fm}---\n\n${md}`, { parser: "markdown" });
  writeFileSync(filePath, md);
}

/**
 * migrate images of the markdown file to tcyun
 * @param {*} file 
 */
async function migrateImages(file) {
  console.log(`[Image migrate]Handling file: ${file}`)
  let res = await Migrater(picgo, [file]);
  if (!res) {
    console.error(`[Image migrate]File migrate img fail: ${file}`)
    return false;
  };
  if (res.success != res.total) {
    console.error(`file migrate img fail, total: ${res.total}, success: ${res.success}`)
    return false;
  }
  return true;
}

/**
 * query the pages of the database
 * @param {*} database_id 
 * @param {*} types 
 * @returns 
 */
async function getPages(database_id, types = ["unpublish", "published"]) {
  let filter = {}
  if (types.length > 1) {
    filter = {
      or: [
        {
          property: config.status.name,
          select: {
            equals: config.status.unpublish,
          },
        },
        {
          property: config.status.name,
          select: {
            equals: config.status.published,
          },
        },
      ],
    }
  } else {
    if (types.length == 0) types = ['unpublish'];
    filter = {
      property: config.status.name,
      select: {
        equals: config.status[types[0]],
      },
    }
  }
  // print the filter
  // console.log('Page filter:', filter);
  let resp = await notion.databases.query({
    database_id: database_id,
    filter: filter,
  });
  return resp.results;
}

/**
 * update the page status to published, and update the abbrlink if exists
 * @param {*} page 
 */
async function updatePageProperties(page) {
  // only update the status property
  // console.log('Page full properties updated:', page.properties);
  let props_updated = {};
  // update status and abbrlink if exists
  [config.status.name, 'abbrlink'].forEach(key => {
    if (page.properties[key]) {
      props_updated[key] = page.properties[key];
    }
  });
  console.log('Page properties updated keys:', props_updated);
  await notion.pages.update({
    page_id: page.id,
    properties: props_updated,
  });
}

/**
 * load properties from the markdown file
 * @param {*} filepath 
 * @returns 
 */

function loadPropertiesAndContentFromMarkdownFile(filepath) {
  // load properties from the markdown file
  // check if the file already exists
  if (!existsSync(filepath)) {
    console.log('File does not exist:', filepath);
    return null;
  }
  const content = readFileSync(filepath, 'utf8');
  // math the front matter
  const fm = content.match(/---\n([\s\S]*?)\n---/);
  // parse the front matter
  if (!fm) return null;
  try {
    const properties = YAML.parse(fm[1]);
    return properties;
  } catch (e) {
    console.log('Parse yaml error:', e);
    return null;
  }
}

/**
 * 生成元数据
 * @param {*} page
 * @returns {Object}
 */
async function getPropertiesDict(page) {
  let data = {};
  for (const key in page.properties) {
    const value = getPropVal(page.properties[key]);
    if (value == undefined || value == "") continue;
    data[key] = value;
  }
  // cover image
  if (page.cover) {
    if (page.cover.type === "external") {
      data['cover'] = page.cover.external.url;
    } else if (page.cover.type === "file") {
      data['cover'] = page.cover.file.url;
    }
  }
  // id, created, updated time
  data['id'] = page.id;
  // data['created'] = page.created_time;
  // data['updated'] = page.last_edited_time;
  return data;
}

/**
 *
 * @param {ListBlockChildrenResponseResult} block
 */
function callout(n2m) {
  return async (block) => {
    let callout_str = block.callout.text.map((a) => a.plain_text).join("");
    if (!block.has_children) {
      return callout2md(callout_str, block.callout.icon);
    }

    const callout_children_object = await getBlockChildren(
      n2m.notionClient,
      block.id,
      100
    );
    // parse children blocks to md object
    const callout_children = await n2m.blocksToMarkdown(
      callout_children_object
    );

    callout_str +=
      "\n" + callout_children.map((child) => child.parent).join("\n\n");

    return callout2md(callout_str.trim(), block.callout.icon);
  };
}

function callout2md(str, icon) {
  return `<aside>\n${icon2md(icon)}${str}\n</aside>`.trim();
}

function icon2md(icon) {
  switch (icon.type) {
    case "emoji":
      return parse(icon.emoji);
    case "external":
      return `<img src="${icon.external.url}" width="25px" />\n`;
  }
  return "";
}

function getPropVal(data) {
  let val = data[data.type];
  if (!val) return undefined;
  switch (data.type) {
    case "multi_select":
      return val.map((a) => a.name);
    case "select":
      return val.name;
    case "date":
      var mt = moment(val.start);
      if (!mt.isValid()) return val.start;
      return mt.tz(config.timezone).format('YYYY-MM-DD HH:mm:ss');
    case "rich_text":
    case "title":
      return val.map((a) => a.plain_text).join("");
    case "text":
      return data.plain_text;
    case "files":
      if (val.length < 1) return "";
      return val[0][val[0].type].url;
    case "created_time":
    case "last_edited_time":
      var mt = moment(val);
      if (!mt.isValid()) return val;
      return mt.tz(config.timezone).format('YYYY-MM-DD HH:mm:ss');
    default:
      return "";
  }
}

module.exports = {
  sync,
  init,
};


/***/ }),

/***/ 442:
/***/ ((module) => {

module.exports = eval("require")("@actions/core");


/***/ }),

/***/ 793:
/***/ ((module) => {

module.exports = eval("require")("@notionhq/client");


/***/ }),

/***/ 663:
/***/ ((module) => {

module.exports = eval("require")("axios");


/***/ }),

/***/ 715:
/***/ ((module) => {

module.exports = eval("require")("cheerio");


/***/ }),

/***/ 436:
/***/ ((module) => {

module.exports = eval("require")("image-size");


/***/ }),

/***/ 506:
/***/ ((module) => {

module.exports = eval("require")("imagemin");


/***/ }),

/***/ 181:
/***/ ((module) => {

module.exports = eval("require")("imagemin-gifsicle");


/***/ }),

/***/ 87:
/***/ ((module) => {

module.exports = eval("require")("imagemin-mozjpeg");


/***/ }),

/***/ 210:
/***/ ((module) => {

module.exports = eval("require")("imagemin-pngquant");


/***/ }),

/***/ 96:
/***/ ((module) => {

module.exports = eval("require")("imagemin-svgo");


/***/ }),

/***/ 737:
/***/ ((module) => {

module.exports = eval("require")("moment-timezone");


/***/ }),

/***/ 471:
/***/ ((module) => {

module.exports = eval("require")("notion-to-md");


/***/ }),

/***/ 309:
/***/ ((module) => {

module.exports = eval("require")("notion-to-md/build/utils/notion");


/***/ }),

/***/ 863:
/***/ ((module) => {

module.exports = eval("require")("picgo");


/***/ }),

/***/ 665:
/***/ ((module) => {

module.exports = eval("require")("picgo-plugin-pic-migrater/dist/lib/FileHandler.js");


/***/ }),

/***/ 634:
/***/ ((module) => {

module.exports = eval("require")("picgo-plugin-pic-migrater/dist/lib/Migrater.js");


/***/ }),

/***/ 324:
/***/ ((module) => {

module.exports = eval("require")("prettier");


/***/ }),

/***/ 109:
/***/ ((module) => {

module.exports = eval("require")("twemoji");


/***/ }),

/***/ 899:
/***/ ((module) => {

module.exports = eval("require")("yaml");


/***/ }),

/***/ 81:
/***/ ((module) => {

"use strict";
module.exports = require("child_process");

/***/ }),

/***/ 113:
/***/ ((module) => {

"use strict";
module.exports = require("crypto");

/***/ }),

/***/ 147:
/***/ ((module) => {

"use strict";
module.exports = require("fs");

/***/ }),

/***/ 37:
/***/ ((module) => {

"use strict";
module.exports = require("os");

/***/ }),

/***/ 17:
/***/ ((module) => {

"use strict";
module.exports = require("path");

/***/ })

/******/ 	});
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __nccwpck_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		var cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			// no module.id needed
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		var threw = true;
/******/ 		try {
/******/ 			__webpack_modules__[moduleId](module, module.exports, __nccwpck_require__);
/******/ 			threw = false;
/******/ 		} finally {
/******/ 			if(threw) delete __webpack_module_cache__[moduleId];
/******/ 		}
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__nccwpck_require__.m = __webpack_modules__;
/******/ 	
/************************************************************************/
/******/ 	/* webpack/runtime/create fake namespace object */
/******/ 	(() => {
/******/ 		var getProto = Object.getPrototypeOf ? (obj) => (Object.getPrototypeOf(obj)) : (obj) => (obj.__proto__);
/******/ 		var leafPrototypes;
/******/ 		// create a fake namespace object
/******/ 		// mode & 1: value is a module id, require it
/******/ 		// mode & 2: merge all properties of value into the ns
/******/ 		// mode & 4: return value when already ns object
/******/ 		// mode & 16: return value when it's Promise-like
/******/ 		// mode & 8|1: behave like require
/******/ 		__nccwpck_require__.t = function(value, mode) {
/******/ 			if(mode & 1) value = this(value);
/******/ 			if(mode & 8) return value;
/******/ 			if(typeof value === 'object' && value) {
/******/ 				if((mode & 4) && value.__esModule) return value;
/******/ 				if((mode & 16) && typeof value.then === 'function') return value;
/******/ 			}
/******/ 			var ns = Object.create(null);
/******/ 			__nccwpck_require__.r(ns);
/******/ 			var def = {};
/******/ 			leafPrototypes = leafPrototypes || [null, getProto({}), getProto([]), getProto(getProto)];
/******/ 			for(var current = mode & 2 && value; typeof current == 'object' && !~leafPrototypes.indexOf(current); current = getProto(current)) {
/******/ 				Object.getOwnPropertyNames(current).forEach((key) => (def[key] = () => (value[key])));
/******/ 			}
/******/ 			def['default'] = () => (value);
/******/ 			__nccwpck_require__.d(ns, def);
/******/ 			return ns;
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/define property getters */
/******/ 	(() => {
/******/ 		// define getter functions for harmony exports
/******/ 		__nccwpck_require__.d = (exports, definition) => {
/******/ 			for(var key in definition) {
/******/ 				if(__nccwpck_require__.o(definition, key) && !__nccwpck_require__.o(exports, key)) {
/******/ 					Object.defineProperty(exports, key, { enumerable: true, get: definition[key] });
/******/ 				}
/******/ 			}
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/ensure chunk */
/******/ 	(() => {
/******/ 		__nccwpck_require__.f = {};
/******/ 		// This file contains only the entry chunk.
/******/ 		// The chunk loading function for additional chunks
/******/ 		__nccwpck_require__.e = (chunkId) => {
/******/ 			return Promise.all(Object.keys(__nccwpck_require__.f).reduce((promises, key) => {
/******/ 				__nccwpck_require__.f[key](chunkId, promises);
/******/ 				return promises;
/******/ 			}, []));
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/get javascript chunk filename */
/******/ 	(() => {
/******/ 		// This function allow to reference async chunks
/******/ 		__nccwpck_require__.u = (chunkId) => {
/******/ 			// return url for filenames based on template
/******/ 			return "" + chunkId + ".index.js";
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/hasOwnProperty shorthand */
/******/ 	(() => {
/******/ 		__nccwpck_require__.o = (obj, prop) => (Object.prototype.hasOwnProperty.call(obj, prop))
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/make namespace object */
/******/ 	(() => {
/******/ 		// define __esModule on exports
/******/ 		__nccwpck_require__.r = (exports) => {
/******/ 			if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
/******/ 				Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 			}
/******/ 			Object.defineProperty(exports, '__esModule', { value: true });
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/compat */
/******/ 	
/******/ 	if (typeof __nccwpck_require__ !== 'undefined') __nccwpck_require__.ab = __dirname + "/";
/******/ 	
/******/ 	/* webpack/runtime/require chunk loading */
/******/ 	(() => {
/******/ 		// no baseURI
/******/ 		
/******/ 		// object to store loaded chunks
/******/ 		// "1" means "loaded", otherwise not loaded yet
/******/ 		var installedChunks = {
/******/ 			179: 1
/******/ 		};
/******/ 		
/******/ 		// no on chunks loaded
/******/ 		
/******/ 		var installChunk = (chunk) => {
/******/ 			var moreModules = chunk.modules, chunkIds = chunk.ids, runtime = chunk.runtime;
/******/ 			for(var moduleId in moreModules) {
/******/ 				if(__nccwpck_require__.o(moreModules, moduleId)) {
/******/ 					__nccwpck_require__.m[moduleId] = moreModules[moduleId];
/******/ 				}
/******/ 			}
/******/ 			if(runtime) runtime(__nccwpck_require__);
/******/ 			for(var i = 0; i < chunkIds.length; i++)
/******/ 				installedChunks[chunkIds[i]] = 1;
/******/ 		
/******/ 		};
/******/ 		
/******/ 		// require() chunk loading for javascript
/******/ 		__nccwpck_require__.f.require = (chunkId, promises) => {
/******/ 			// "1" is the signal for "already loaded"
/******/ 			if(!installedChunks[chunkId]) {
/******/ 				if(true) { // all chunks have JS
/******/ 					installChunk(require("./" + __nccwpck_require__.u(chunkId)));
/******/ 				} else installedChunks[chunkId] = 1;
/******/ 			}
/******/ 		};
/******/ 		
/******/ 		// no external install chunk
/******/ 		
/******/ 		// no HMR
/******/ 		
/******/ 		// no HMR manifest
/******/ 	})();
/******/ 	
/************************************************************************/
var __webpack_exports__ = {};
// This entry need to be wrapped in an IIFE because it need to be isolated against other modules in the chunk.
(() => {
const notion = __nccwpck_require__(630);
const core = __nccwpck_require__(442);


function isJson(str) {
  try {
    const obj = JSON.parse(str);
    if (obj && typeof obj == "object") return true;
  } catch (e) { }

  return false;
}

var migrate_image = core.getInput("migrate_image") === "true" || false;
const picBedConfigStr = core.getInput("picBedConfig") || "{}";

// test the picBed config
if (!isJson(picBedConfigStr)) {
  core.warning("picBedConfig is not a valid json string, use default config: {}, and set migrate_image to false.");
  migrate_image = false;
}

var picBedConfig = {};

if (migrate_image) {
  core.info("migrate_image is true, use picBedConfig to upload images.");
  picBedConfig = JSON.parse(picBedConfigStr);
}

var pic_base_url = core.getInput("pic_base_url") || null;

if (pic_base_url && !pic_base_url.endsWith("/")) {
  pic_base_url = pic_base_url + "/";
}

let config = {
  notion_secret: core.getInput("notion_secret"),
  database_id: core.getInput("database_id"),
  migrate_image: migrate_image || false,
  picBed: picBedConfig || {},
  pic_base_url: pic_base_url || null,
  pic_compress: core.getInput("pic_compress") === "true" || false,
  status: {
    name: core.getInput("status_name") || "status",
    unpublish: core.getInput("status_unpublish") || "未发布",
    published: core.getInput("status_published") || "已发布",
  },
  output_dir: {
    page: core.getInput("page_output_dir") || "source/",
    post: core.getInput("post_output_dir") || "source/_posts/notion/",
    clean_unpublished_post: core.getInput("clean_unpublished_post") === "true" || false,
  },
  timezone: core.getInput("timezone") || "Asia/Shanghai",
};

// add current running file dir to PATH
process.env.PATH = __dirname + ":" + process.env.PATH;
// add all the exec file under __dirname/vendor* dirs the executable permission expect the source dir
const { execSync } = __nccwpck_require__(81);
// try to find all the files under __dirname/vendor* dirs and set the executable permission
try {
  execSync(`find ${__dirname}/vendor* -type f -not -name "*.tar.gz" -exec chmod +x {} \\;`);
} catch (e) {
  console.log(`Failed to set the executable permission for all the files under ${__dirname}/vendor* dirs, error: ${e}`);
}

(async function () {
  notion.init(config);
  await notion.sync();
})();

})();

module.exports = __webpack_exports__;
/******/ })()
;