#!/usr/bin/env node
var fs = require('fs');

if(process.argv.length < 3) {
    console.log('Please specify the json file to mock a device.');
    process.exit(1);
}

var filename = process.argv[2];
var device;
try {
    fs.accessSync(filename, fs.constants.R_OK);
    var str = fs.readFileSync(filename, 'utf8');
    device = JSON.parse(str);
}
catch(error) {
    console.error(error.message);
    process.exit(1);
}

var template = [];
template.push("var ble = require('ble-sdk');");
template.push("var device = require('./" + filename + "');");
template.push("var handler = {");

var chars = [];
for(var service of device.services) {
    for(var char of service.characteristics) {
        var char_arr = [];
        char_arr.push("    " + char.name + ": {");
        var props = [];
        for(var prop of char.properties) {
            if(prop == 'read') {
                props.push("        onRead: (offset,callback)=> {}");
            }
            else if(prop == 'write') {
                props.push("        onWrite: (data,offset,withoutResponse,callback) => {}");
            }
            else if(prop == 'notify') {
                props.push("        onSubscribe: (maxValueSize,updateValueCallback)=>{}");
                props.push("        onUnsubscribe: (maxValueSize)=>{}");
            }
        }
        char_arr.push(props.join(',\n'));
        char_arr.push("    }");
        chars.push(char_arr.join('\n'));
    }
}
template.push(chars.join(',\n'));

template.push("};");
template.push("ble.mock(device, handler).catch((error)=>{");
template.push("    console.error(error);");
template.push("    process.exit(1);");
template.push("});");

var str = template.join('\n');
var out = 'index.js';
fs.writeFile(out, str, (error)=>{
    if(error)
        console.error('write script file failed: ' + error.message);
    else
        console.log('script created: ' + out);
});
