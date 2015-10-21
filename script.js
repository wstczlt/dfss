// ==UserScript==
// @name         东方时尚课程自动播放
// @namespace    http://your.homepage/
// @version      0.1
// @description  enter something useful
// @author       You
// @match        *://dfss.anjia365.com/jpv2/web/personPlan!player.do*
// @grant        none
// @require        jquery.min.js
// ==/UserScript==

// 作用: 自动学习完东方时尚科目一的课程, 不用再等待视频播放, 不用点下一步, 不用做题!
// 使用方法: 下载此文件保存成dfss_autoplay.user.js, 拖进chrome浏览器即可

alert('自动播放插件加载成功');
setInterval(function() {
    var doDanxuan = function() {
        var radios = $('input[type="radio"]');
        if (radios.length > 0) {
            radios.each(function() {
                $(this).click();
                var answerHints=$("#answerHints").first().html();
                if(answerHints.indexOf("回答正确") != -1) {
                    // 答对,退出循环
                    return false;
                }else {
                    // 答错
                }
            });
        }
    };

    var doDuoxuan = function() {
        var checkboxs = $('input[type="checkbox"]');
        if (!checkboxs.length) {
            return;
        }
        for (var i=0;i<=1;i++) {
            for (var j=0;j<=1;j++) {
                for (var k=0;k<=1;k++) {
                    for (var v=0;v<=1;v++) {
                        if (i == 0) {
                            $('#answer0').click();
                        }
                        if (j == 0) {
                            $('#answer1').click();
                        }
                        if (k == 0) {
                            $('#answer2').click();
                        }
                        if (v == 0) {
                            $('#answer3').click();
                        }
                        $('#confirmAnswer')[0].click();

                        var answerHints=$("#answerHints").first().html();
                        if(answerHints.indexOf("回答正确") != -1) {
                            // 答对,退出循环
                            return false;
                        }else {
                            // 答错
                        }
                    }
                }
            }
        }
    };

    doDanxuan();
    doDuoxuan();
    var btnNext = $('#btnNext');
    if (btnNext.length > 0) {
        btnNext[0].click();
    }
        
    var downBtn = $(".dfss_down");
    if (downBtn.length > 0) {
        downBtn.find('a')[0].click();
    }
    var nextPlayBtn = $("#nextPlayButton");
    if (nextPlayBtn.length > 0) {
        nextPlayBtn[0].click();
    }
}, 3100);