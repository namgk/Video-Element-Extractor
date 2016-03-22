// Copyright (c) 2012 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

// Search the bookmarks when entering the search keyword.
$(function() {
    console.log('asking content');
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
        chrome.tabs.sendMessage(tabs[0].id, 'get me video', function(response) {
            $('#video').text(response.video);
            $('#videosrc').text(response.videosrc);
        });
    });
});

// A function to use as callback
function doStuffWithDom(domContent) {
    console.log('I received the following DOM content:\n' + domContent);
}

document.addEventListener('DOMContentLoaded', function () {
});
