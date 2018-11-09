var express = require('express');
var path = require('path');
var proxy = require('http-proxy-middleware');
var app = express();

// 配置静态资源根目录
app.use(express.static(path.join(__dirname,"./")));

app.get('/',function(req,res){
    res.append('Content-Type', 'text/plain;charset=UTF8');
    res.end('服务器正常,我想看看~~');
})

// proxy 中间件的选择项
var options = {
    target: 'http://106.14.39.56', // 目标服务器 host
    changeOrigin: true,               //默认false，是否需要改变原始主机头为目标URL
    // ws: true,                         // 是否代理websockets
    pathRewrite: {
        '^/api' : '',     // 重写请求，比如我们源访问的是api/old-path，那么请求会被解析为/api/new-path
    }
};

// 创建代理
var exampleProxy = proxy(options);

app.use("/api",exampleProxy);

var server = app.listen("8000",() => {
    var host = server.address().address;
    var port = server.address().port;
    var listenAdress = 'http://' + host + ':' + port;
    console.log('Example app listening at ' + listenAdress);
    console.log("服务器已开启.....");
})