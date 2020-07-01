(function anonymous() {
    //设置默认的配置项
    let _default = {
        method: 'get',
        url: '',
        baseUrl: '',
        headers: {},
        dataType: "JSON",
        data: null,//post系列请求基于请求主体传递给服务器内容
        params: null,//get系列请求基于问号传参给无服务器的内容
        cache: true,

    }
    let ajaxPromise = function ajaxPromise(options) {
        //options中融合了：默认配置信息、用户基于default修改的信息，用户执行get、post
        //方法传递的配置信息
        let { url, baseUrl, method, data, dataType, headers, cache, params } = options;
        //把传递的参数进一部处理
        if (/^(GET|DELETE|HEAD|OPRIONS)$/i.test(method)) {
            //get 系列
            if (params) {
                url += `${ajaxPromise.check(url)}${ajaxPromise.formatData(params)}`;
            }
            if (cache === false) {
                url += `${ajaxPromise.check(url)}_= ${+new Date()}`;
            }
            data = null;//get 请求主体就是什么都不放
        } else {
            //post系列
            if (data) {
                data = ajaxPromise.formatData(data)
            }
        }
        //基于promise管理发送ajax
        return new Promise((res, err) => {
            let xhr = new XMLHttpRequest;
            xhr.open(method, `${baseUrl}${url}`);
            //如果headers存在我们设置请求头
            if (headers !== null && typeof headers === 'object') {
                for (let attr in headers) {
                    if (headers.hasOwnProperty(attr)) {
                        let val = headers[attr];
                        if (/[\u4e00-\u8fa5]/.test(val)) {
                            //如果val中包含中文，我们进行编码
                            //encodeURIComponent/decodeURIComponent
                            val = encodeURIComponent(val);
                        }
                        xhr.setRequestHeader(attr, val)

                    }
                }
            }
            xhr.onreadystatechange = () => {
                if (xhr.readyState === 4) {
                    if (/^(2|3)\d{2}$/.test(xhr.status)) {
                        let result = xhr.responseText,
                            dataType = dataType.toUpperCase();
                        dataType === 'JSON' ? result = JSON.stringify.parse(result) : (dataType === 'XML' ? result = xhr.responseXML : null)
                        res(result);
                    }
                    err(xhr.responseText, xhr)
                }

            }
            xhr.send(data);

        });

    }
    ['get', 'delete', 'head', 'options'].forEach(item => {
        ajaxPromise[item] = function anonymous(url, options = {}) {
            options = {
                ..._default,//默认值或者基于default修改的值
                ...options, //用户调取方法传递的配置项
                url: url,    //请求的URL地址（第一给参数；默认配置项和传递
                //项中都不会出现url，只能这样获取
                method: item.toUpperCase()//以后执行坑底是ajax.promise.head执行
                //不会设置methods这个配置项，我们自己余姚设置才可以
            };
            return ajaxPromise(options);
        }

    })
    ['post', 'put', 'patch'].forEach((item) => {
        ajaxPromise[item] = function anonymous(url, data = {}, options = {}) {
            options = { ..._default, ...options, url: url, method: item.toUpperCase(), data: data }
        }
        return ajaxPromise(options);
    })

    //把对象转为URLENcode字符串
    ajaxPromise.formatData = function (obj) {
        let str = ``;
        for (let key in obj) {
            if (obj.hasOwnProperty(key)) {
                str += `${key}=${obj[key]}&`
            }
        }
        return str.substring(0, str.length - 1);
    }
    ajaxPromise.check() = function (urlstr) {

        return urlstr.indexOf('?') > -1 ? '&' : '?';
    }
    window.ajaxPromise = ajaxPromise;
    //把默认配置暴露出去，后期用户在使用的时候可以设置基本的默认值
    //发送ajax请求的时候按照用户配置的信息进行处理
    ajaxPromise.default = _default;
})(window);