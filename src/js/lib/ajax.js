// File:        ajax.js (ES6 version)
// Contents:    cross domain ajax wrapper around XMLHttpRequest and XDomainRequest (same domain IE7+, cross domain IE8+)
// Created:     05.04.2014
// Programmer:  Edward A. Shiryaev

import { url } from './url.js';
import { isEmpty, assert } from './util.js';

var ajax = (function() {
  
  //---- private members ----
  
        // Prepares and returns the response key/value object.
        // Parameters:
        //    r:
        //    {
        //      [ responseText: <response text as received from the server if any>, ]
        //      [ format:       <'json' or 'text', must be specified if responseText is specified (even if empty)>, ]
        //      [ errorMsg:     <error message, not specified (ignored) if responseText is specified> ]
        //    }
  
  function handleResponse_(r)
  {
    var response = {};
    
    // handle error case
    if(r.responseText == undefined) {
      response.error = r.errorMsg || ajax.errors.UNKNOWN;
      return response;
    }
    
    switch(r.format) {
      case 'text':
        response.data = r.responseText;
        break;
      
      case 'json':
        if(r.responseText != '') {
          try {
            response = JSON.parse(r.responseText);
          }
          catch(e) {
            response['error'] = r.responseText;
          }
        }
        break;
    }
    
    return response;
  }
  
        // Sends a request via XMLHttpRequest.
  
  function xhrSend_(request, callback)
  {
    var timeout;
    
    if(!window.XMLHttpRequest) {
      callback(handleResponse_({ errorMsg: ajax.errors.NO_AJAX }));
      return;
    }
    
    var xhr = new XMLHttpRequest();
    xhr.open(request.postData ? 'POST' : 'GET', request.url, true);
    
    var data = null;  // data to send
    if(request.postData) {
      if(request.format.output == 'urlencoded') {
        xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
        if(!isEmpty(request.postData))  // keep data==null if request.postData=={}
          data = url.buildQuery(request.postData);
      }
      else if(request.format.output == 'json')
        if(!isEmpty(request.postData))  // keep data==null if request.postData=={}
          data = JSON.stringify(request.postData);
    }

    xhr.onreadystatechange = function() {
      
      if(xhr.readyState != 4)
        return;
      
      clearTimeout(timeout);
      
      if(xhr.status != 200) {
        var serverError = xhr.status && xhr.statusText ? (xhr.status + ' ' + xhr.statusText) : '';
        callback(handleResponse_({ errorMsg: request.errorMsg || serverError || ajax.errors.UNKNOWN }));
        return;
      }
      
      callback(handleResponse_({ responseText: xhr.responseText, format: request.format.input }));
    }

    xhr.send(data);
    
    timeout = setTimeout(function() {
      xhr.abort();
      callback(handleResponse_({ errorMsg: ajax.errors.TIMEOUT }));
    }, request.timeout);
  }
  
  //---- public members ----
  
  var ajax = {};
  
        // Default timeout in milliseconds.  
  
  ajax.timeout = 10000;
  
        // Customizable error messages.  
  
  ajax.errors = {
    'NO_AJAX':  'Your browser does not support AJAX requests',
    'TIMEOUT':  'Request did not complete within timeout',    
    'UNKNOWN':  'Request did not complete due to an error'  
  };
  
        // Asynchronously sends a request.
        // Parameters:
        //    request   - object literal as follows:
        //    {
        //        url:        <request URL, with parameters or not>,
        //      [ urlParams:  <key/value object of URL parameters to be merged with request.url parameters if any>, ]
        //      [ postData:   <key/value data object to send via POST-request; if not specified, GET-request is made>, ]
        //      [ format:     <format for input (response) and output (request.postData) data>
        //        {
        //          [ input:    <either 'json' or 'text'; 'json' causes to parse response as json into key/value object;
        //                      'text' causes to write the response as a whole into 'data' field of the key/value object;
        //                      if empty or not specified, 'json' is taken by default>, ]
        //          [ output:   <either 'urlencoded' or 'json'; 'urlencoded' causes to url encode request.postData and
        //                      also to set 'Content-Type' HTTP header to 'application/x-www-form-urlencoded' (except
        //                      when XDomainRequest is used in which case no header is set); 'json' causes to json
        //                      encode request.postData; if empty or not specified 'urlencoded' is taken by default> ]
        //        }, ]
        //      [ timeout:    <timeout in milliseconds for this request; if not specified, ajax.timeout is taken>, ]
        //      [ errorMsg:   <custom error message to return to the client in case of an error, no matter of an error
        //                    message from the server> ]
        //    }
        //    callback  - event handler to be called on receiving the response from the server; takes one parameter:
        //                  response  - server response as key/value object; in case of 'json' input data format, it is
        //                              evaluated from server's json, empty if server sent no data; in case of 'text'
        //                              has one 'data' field populated with server response; in case of an error has a
        //                              single 'error' field with an error message (no matter of input data format used)
  
  ajax.send = function(request, callback)
  {
    var r = {};       // request object for xhrSend_()
    var rParts;       // request URL parts
    
    //---- process r.url ----
    
    r.url = request.url;
        
    if(!isEmpty(request.urlParams || {})) {
      rParts = url.parseUrl(r.url);
      
      var params = {};
      if(rParts.query)
        params = url.parseQuery(rParts.query);
      
      for(var key in request.urlParams)
        params[key] = request.urlParams[key]; // add new or override existing
        
      rParts.query = url.buildQuery(params);
      r.url = url.buildUrl(rParts);
    }
    
    //---- process r.postData ----
    
    r.postData = request.postData;  // we may copy a reference as we are not going to change r.postData
    
    //---- process r.format ---- 
    
    request.format = request.format || {};
    r.format = {};
    r.format.input = request.format.input || 'json';
    r.format.output = request.format.output || 'urlencoded';
    assert(r.format.input == 'json' || r.format.input == 'text', 'ajax.send(): Invalid input data format');
    assert(r.format.output == 'json' || r.format.output == 'urlencoded', 'ajax.send(): Invalid output data format');

    //---- process r.timeout ----
    
    r.timeout = request.timeout || ajax.timeout;  // timeouts cannot be 0
    assert(r.timeout != 0, 'ajax.send(): timeout is 0');
    
    //---- process r.errorMsg ----
    
    r.errorMsg = request.errorMsg;
    
    xhrSend_(r, callback);
  }
  
  return ajax;
  
})();

export { ajax };