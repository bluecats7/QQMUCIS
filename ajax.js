(function anonyous() {
    function AJAX(option) {
        return new init(option)
    }
    let init = function init(option) {

        //=>init param
        let {
            url,
            method = 'GET',
            data = null,
            dataType = 'JSON',
            async = true,
            cache = true,
            success,
            error
        } = option;
        //mount:把配置项挂载到实列上
        ['url', 'method', 'data', 'dataType', 'async', 'success', 'error'].forEach(item => {
            this[item] = eval(item)

        });
        this.sendAjax();
    }

    AJAX.prototype = {
        constructor: AJAX,
        init,
        sendAjax() {
            this.handleData();
            this.handleCache();
            let { method, url, async, error, success, data } = this;
            let xhr = new XMLHttpRequest;
            xhr.open(method, url, async);
            xhr.onreadystatechange = () => {
                if (xhr.readyState === 4) {
                    if (!/^(2|3)\d{2}$/.test(xhr.status)) {
                        error && error(xhr.statusText, xhr);
                        return;
                    }
                    //success

                    //处理data
                    let result = this.handlDataType(xhr)
                    success && success(result, xhr);
                }


            };
            xhr.send(data);
        },
        handlDataType(xhr) {
            let { dataType } = this;
            dataType = dataType.toUpperCase();
            let result = xhr.responseText;
            switch (dataType) {
                case 'TEXT':
                    break;
                case 'JSON':
                    result = JSON.parse(result);
                    break;
                case 'XML':
                    result = xhr.responseXML;
                    break;

            }
            return result;
        },
        handleCache() {
            let { url, method, cache } = this;
            if (/^GET$/i.test(method) && cache === false) {
                url += this.check() + '_=' + new Date();//url末尾加时间戳
                this.url = url;
            }

        },
        check() {
            return this.url.indexOf('?') > -1 ? '&' : "?"

        },
        handleData() {
            let { data, method } = this;
            if (!data) return;
            if (typeof data === 'object') {
                //如果是个object对象，我们把它转为x-www-form-urlencoded
                //根据请求的方式不一样，传递给请求的参数也不一样
                if (/^(GET|DELETE|HEAD|TRACE|OPTIONS)$/i.test(method)) {
                    this.url += `${this.check()}${data}`;
                    this.data = null;
                    return;
                }
                let str = ``;
                for (let key in data) {
                    if (data.hasOwnProperty(key)) {
                        str += `${key}=${data[key]}&`;
                    }
                }
                data = str.substr(0, str.length - 1);
                this.data = data;//post的处理
            }
        }

    }
    window.ajax = AJAX
    init.prototype = AJAX.prototype;
})(window);
ajax({})