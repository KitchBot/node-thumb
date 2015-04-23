var setting = require('./setting')
var azure = require('azure-storage');
var http = require('http');
var sharp = require('sharp');
var sizePattern = /^\s*(s|w|h)(\d{0,4})(?:\-(c|m|s))?(?:\-(g|b\d{1,4}))?(?:\-(g|b\d{1,4}))?\s*$/
var sizePattern_2 = /^\s*w(\d{0,4})h(\d{0,4})(?:\-(c|m|s))?(?:\-(g|b\d{1,4}))?(?:\-(g|b\d{1,4}))?\s*$/
var sizePattern_3 = /^\s*h(\d{0,4})w(\d{0,4})(?:\-(c|m|s))?(?:\-(g|b\d{1,4}))?(?:\-(g|b\d{1,4}))?\s*$/
http.createServer(function(request, response) {
    var paths = request.url.split('/')
    if(paths.length<=2){
        throw404();
        return
    }
    if(paths[1]!==setting.folderName){
        throw404();
        return
    }
    var size = paths[2];
    paths.splice(0,3);
    var m1 = size.match(sizePattern)
    var m2 = null;
    var m3 = null;
    var w = null;
    var h = null;
    var c = null;
    var sc = [];
    var skip = false;
    if(!m1){
        m2 = size.match(sizePattern_2)
        if(!m2){
            m3 = size.match(sizePattern_3)
            if(!m3){
                throw404()
                return
            }else{
               h = parseInt(m3[1]);
               w = parseInt(m3[2]); 
               c = m3[3]
               for(var i=4;i< m3.length;i++)
                    sc.push(m3[i])
            }

        }else{
            w = parseInt(m2[1]);
            h = parseInt(m2[2]);
            c = m2[3]
            for(var i=4;i< m2.length;i++)
                sc.push(m2[i])
            
        }
        
    }else{
        var num = parseInt(m1[2])
        if(num!==0){
            switch (m1[1])
            {
                case "w":
                    w = num;
                    break;
                case "h":
                    h = num;
                    break;
                case "s":
                    w = num;
                    h = num;
                    break;
            }
        }else{
            skip = true;
        }
        c = m1[3]
        
        for(var i=4;i< m1.length;i++){
            sc.push(m1[i])
        }
        
    }


    filepath = paths.join('/');
    
    var blobService = azure.createBlobService(setting.account,setting.key);
    var transform = sharp().resize(w, h)
    if(c){
        switch(c){
            case "c":
                transform = transform.crop(sharp.gravity.center);
                break;
            case "m":
                transform = transform.max();
                break;
        }

    }else{
        transform = transform.background({r:255,g:255,b:255,a:0}).embed()
    }
    var gray = false;
    var blur = false;
    if(sc.length>0){
        for(var i=0;i<sc.length;i++){
            if(sc[i]==="g" ){
                if(!gray){
                    gray = true
                    transform = transform.grayscale()
             
                }
                continue;
            }else{
                if(!blur){
                    blur = true;
                    transform = transform.blur(parseInt(sc[i].substring(1)));
                }
            }
        }
    }
    var blob = blobService.createReadStream('images', filepath)
    blob.on('error',function(){
        throw404()
    })
    
    response.writeHead(200, {'Content-Type': 'image/jpeg'});
    if(!skip)
        blob.pipe(transform).pipe(response);
    else
        blob.pipe(response);
    function throw404(){
        response.writeHead(404);
        response.end();
        return;
    }
}).listen(8000);
