let musicRender = (function () {
    let $mainBox = $('.mainBox'),
        $headerBox = $('.headerBox'),
        $contentBox = $('.contentBox'),
        $footerBox = $('.footerBox'),
        $progressBox = $footerBox.find('.progressBox'),
        $already = $progressBox.find('.already'),
        $duration = $progressBox.find('.duration'),
        $run = $progressBox.find('.run'),
        $wrapper = $contentBox.find('.wrapper'),
        $lyricList = null,
        $musicAudio = $mainBox.find('#musicAudio'),
        $playBtn = $headerBox.find('.playBtn');

    let font = document.documentElement.style.fontSize;
    font = parseFloat(font);
    let winH = document.documentElement.clientHeight;

    let computedContent = function () {
        $contentBox.css({
            height: winH - $headerBox[0].offsetHeight - $footerBox[0].offsetHeight - 0.8 * font

        })
    }

    let queryLyric = function () {
        return new Promise((resolve) => {
            $.ajax({
                url: './json/lyric.json',
                method: 'get',
                dataType: 'json',
                success: resolve
            })

        })

    }

    let dataBind = function (res) {
        let { lyric = '' } = res;
        let obj = { 32: ' ', 40: "(", 41: ")", 45: '-' };

        lyric = lyric.replace(/&#(\d+);/g, (...arg) => {
            //&#32; 32 
            let [item, num] = arg;
            /*  switch (parseFloat(num)) {
                 case 32:
                     item = ' ';
                     break;
                 case 40:
                     item = '('
                     break;
                     
             } */
            item = obj[num] || item;
            return item;//这个replace方法结果return给lyric
        })
        return lyric
    }

    let getMessage = function (lyric) {
        {
            /*            lyric += '&#10;' (&#10;)?整体0次或者1次 */
            //上一个then方法中返回的结果就会返回到下一个then的形参上
            //format-data 把歌词对应的分钟。秒歌词内容等信息一次存储起来
            let lyricAry = [];
            lyric.replace(/\[(\d+)&#58;(\d+)+&#46;\d+\]([^&#]+)(&#10;)?/g, (...arg) => {
                let [, minutes, seconds, content] = arg;
                lyricAry.push({ minutes, seconds, content })

            });
            //分组大正则捕获，小正则就不捕获
            return lyricAry;
        }
    }

    let bindHtml = function (lyricAry) {
        let str = '';
        lyricAry.forEach(item => {
            let { minutes, seconds, content } = item;
            /* 数据绑定的时候把歌词对应的分钟和秒设置为自定义属性，
            后期需要使用直接获取即可 */
            str += `<p data-minutes='${minutes}' data-seconds='${seconds}'>${content}</p>`;
            $wrapper.html(str);
            computedContent();
            $lyricList = $contentBox.find('.wrapper').find('p')
        })
    }
    let $plan = $.Callbacks();

    let playRun = function () {
        $musicAudio[0].play();
        //点击加载完成，发生 canplay 事件
        $musicAudio[0].addEventListener('canplay', $plan.fire);
        //=>控制暂停播放
        $plan.add(() => {
            $playBtn.css('display', 'block').addClass('move')
            $playBtn.tap(() => {
                if ($musicAudio[0].paused) {
                    $musicAudio[0].play();
                    // $musicAudio[0].addEventListener('canplay', $plan.fire);
                    $plan.fire();
                    $playBtn.addClass('move');
                    return;
                } else {
                    clearInterval(autoTime);
                    $musicAudio[0].pause();
                    $playBtn.removeClass('move');
                }
            })
        })

        //>控制进度条
        $plan.add(() => {
            let duration = $musicAudio[0].duration;
            console.log(duration);
            /* 获取的时间是秒 */
            let time = computedTime(duration)
            let { seconds, minutes } = time;
            $duration.html(`${minutes} : ${seconds}`);
            //随时监听播放状态
            autoTime = setInterval(() => {
                let currentTime = $musicAudio[0].currentTime
                if (currentTime >= duration) {
                    //播放完成
                    clearInterval(autoTime);
                    let time = computedTime(duration)
                    let { seconds, minutes } = time;
                    $already.html(`${minutes} : ${seconds}`)
                    $run.css({
                        width: '100%'
                    })
                    $musicAudio[0].pause();
                    $musicAudio.removeClass('move');
                    return;
                }
                //正常播放设置进度条的百分比
                let time = computedTime(currentTime)
                let { seconds, minutes } = time;
                $already.html(`${minutes} : ${seconds}`)
                $run.css({
                    width: currentTime / duration * 100 + '%'
                    //当我停止播放，currentTime是固定的，width设定的比例也是固定的
                })
                matchLyric(currentTime);
                /* 已经播放的时间 */
            }, 1000)
        })
    }
    let translateY = 0;
    let matchLyric = function (currentTime) {
        let time = computedTime(currentTime)
        let { seconds, minutes } = time;
        let $cur = $lyricList.filter(`[data-minutes='${minutes}']`).filter(`[data-seconds='${seconds}']`)
        /*拿到的p是当前currentTime=$cur */
        console.log($cur)
        let index = $cur.index();
        //index() 方法返回指定元素相对于其他指定元素的 index 位置。并且在plist上是第几个元素
        if ($cur.length === 0 && $cur.hasClass('active')) {
            /* .active表示已经被选中了，这个歌词可能需要5秒钟完成，定时器执行5次
                第一次让走之后，就不让他继续往下走了，wrapper也不会向上移动了
                */
            return;
        } else {
            $cur.addClass('active').siblings().removeClass('active');
            if (index >= 4) {
                let curH = $cur[0].offsetHeight
                translateY -= curH;
                $wrapper.css({
                    transform: `translateY(${translateY}px)`
                })
            }
        }
    }
    /* 计算时间的方法 */
    let computedTime = function (duration) {
        //219.614331必须去整
        let minutes = Math.floor(duration / 60);
        let seconds = Math.floor(duration - (minutes * 60));
        seconds = seconds < 10 ? '0' + seconds : seconds;
        minutes = minutes < 10 ? '0' + minutes : minutes;
        return { seconds, minutes };
    }



    return {
        init: function () {
            let Promise = queryLyric();
            Promise.then(dataBind)
                .then(getMessage)
                .then(bindHtml)
                .then(playRun);
        },
        computedContent,
    }
})();
musicRender.init();