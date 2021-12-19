var years = [];
var dois = [];

var cy = window.cy = cytoscape({
    container: document.getElementById('cy'),
    boxSelectionEnabled: false,
    autounselectify: true,
    layout: {
        name:'dagre',
    },

    style: [
        {
            selector: 'node',
            style: {
                //'content': 'data(title)',
                'content': function(e) {return '#' + e.data('no') + ',' + e.data('year') + ':' + cutStr(e.data('title'))},
                'width': '200',
                'height': '200',
                'text-opacity': 4,
                'text-valign': 'center',
                'text-halign': 'center',
                'font-size': '60',
                'background-color': 'data(color1)'
            }
        },
        {
            selector: 'node:parent',
            style: {
                'content': function(e) {return e.data('id')},
                'width': '200',
                'height': '200',
                'text-opacity': 4,
                'text-valign': 'center',
                'text-halign': 'left',
                'font-size': '150',
                'background-color': function(e) {return e.data('color1')},
            }
        },
        {
            selector: 'edge',
            style: {
                'curve-style': 'bezier',
                'width': 8,
                'source-arrow-shape': 'triangle',
                'line-color': '#9818D6',
                'source-arrow-color': '#9818D6',
                'arrow-scale': 2,
            }
        }
    ],
    elements: {
        nodes: [
            //format
            //{data: {id: 'doi1', title: 'test', color1: '#FFA41B', parent: 'year1',  JP: '', EN: 'title1', author: 'author1' ,source_title: 'source_title1'}},
            //{data: {id: 'doi2', title: 'test', color1: '#FFA41B', parent: 'year2',  JP: '', EN: 'title2', author: 'author2' ,source_title: 'source_title2'}},
            //{data: {id: 'year1', color1: '#EDEDED'}}
            //{data: {id: 'year2', color1: '#EDEDED'}}
        ],
        edges: [
            //format
            //{data: {source: 'doi1', target: 'doi2'}},
        ]
    },
    
    minZoom: 0.1,
    maxZoom: 30,
    wheelSensitivity : 0.2,
});


// nodeのpopup
var makeTippy = function(node, text) {
    var ref = node.popperRef();
    var dummyDomEle = document.createElement('div');
    return tippy(dummyDomEle, {
        getReferenceClientRect: ref.getBoundingClientRect,
        trigger: 'manual',
        content: function() {
            var no = node.data('no');
            var title = node.data('title');
            var doi = node.data('id').replace(/\*$/, "");
            var year = node.data('year');
            var author = node.data('author');
            var source_title = node.data('source_title');
            var div = document.createElement('div');
                div.innerHTML = '<p>#' + no + '</p><p>'+ title +'</p><p>doi : <a href = "https://doi.org/' + doi + '" target="_blank">' + doi + '</a></p><p>year : ' + year + '</p><p>author : ' + author + '</p><p>source_title : ' + source_title + '</p><p><form><input type="button" id="'+doi+'" value="引用している論文を探す" onclick="getCiting(this.id)" ></form></p><p><form><input type="button" id="'+doi+'" value="引用されている論文を探す" onclick="getCited(this.id)" ></form></p>';
            return div;
        },

        //trigger: 'click',
        arrow: true,
        boundary: 'scrollParent',
        distance: 10,
        placement: 'bottom',
        //hideOnClick: false,
        hideOnClick: true,
        //multiple: true,
        size: 'small',
        sticky: true,
        interactive: true,
        appendTo: document.body,
        ignoreAttributes: true,
        //theme: 'custom',
    });
};

tippy_array = [];
cy.on('tap', 'node', function(e) {
    if (e.target.data('year') !== undefined) {
        temp_id = e.target.data('id');
        console.log(temp_id);
        if (tippy_array[temp_id]) {
            tippy_array[temp_id].hide();
            delete tippy_array[temp_id];
        } else {
            //tippy_array[temp_id] = makeTippy(e.target, temp_id);
            tippy_array[temp_id] = makeTippy(cy.getElementById(temp_id), temp_id);
            tippy_array[temp_id].show();
        }
    }
});

cy.fit();

// グラフ描画
var tabulator_data = [];
drawTabulator();

function cutStr(str){
  if (str.length > 38) {
    return str.substr(0,37) + "...";
  } else {
    return str;
  }
}


// 初期ノードの追加
function searchDOI(){
  var input = document.getElementById("doi").value;

  try {
    var url = 'https://opencitations.net/index/coci/api/v1/metadata/'+input;
    var xhr = new XMLHttpRequest();
    xhr.open('GET', url, true);
    xhr.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');
    xhr.onreadystatechange = function() {
      try {
        if(xhr.readyState == 4) {
          if(xhr.status == 200) {
            if(xhr.responseText == '[]') {
              throw new Error("error");
            } 
            var json2 = JSON.parse(xhr.responseText);
            var title = json2[0].title;
            var year = json2[0].year;
            var doi = json2[0].doi;
            var author = json2[0].author;
            var source_title = json2[0].source_title;
            console.log("title:"+title+"\nyear:"+year+"\ndoi:"+doi+"\nauthor:"+author+"\nsource_title:"+source_title);
            //if(!years.includes(year)){
            //  cy.add({group:'nodes',data:{id: year, color1: '#EDEDED'}});
            //  years.push(year);
            //}
            cy.add({group:'nodes',data:{id: doi, no: 1, title: title, color1: '#FF5151', year: year, EN: 'title' , author: author ,source_title: source_title}});
            dois.push(doi);
            cy.layout({name:'dagre'}).run();
            cy.fit();
            drawTabulator();
            document.getElementById("status").innerHTML = "　";
            document.getElementById("message").innerHTML = "　";
          } else {
            throw new Error("error");
          }
        }
      } catch (e) {
        document.getElementById("message").innerHTML = "論文が取得できませんでした。やり直してみてください。";
        return;
      }
    }
    xhr.send();
  } catch(e) {
    document.getElementById("message").innerHTML = "論文が取得できませんでした。やり直してみてください。";
    return;
  }
}

function arrayShuffle(array) {
  for(var i = (array.length - 1); 0 < i; i--){
    var r = Math.floor(Math.random() * (i + 1));
    var tmp = array[i];
    array[i] = array[r];
    array[r] = tmp;
  }
  return array;
}

function getCiting(doi) {
  console.log("citing:"+doi);
  //citing
  try {
    var url = 'https://opencitations.net/index/coci/api/v1/references/'+doi;
    var xhr = new XMLHttpRequest();
    xhr.open('GET', url, true);
    xhr.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');
    xhr.onreadystatechange = function() {
      try {
        if(xhr.readyState == 4) {
          if(xhr.status == 200) {
            addCitingNode(xhr.responseText);
          } else {
            throw new Error("error");
          }
        }
      } catch (e) {
        document.getElementById("message").innerHTML = "論文が取得できませんでした。やり直してみてください。";
        return;
      }
    }
    xhr.send();
  } catch(e) {
    document.getElementById("message").innerHTML = "論文が取得できませんでした。やり直してみてください。";
    return;
  }
}

function addCitingNode(response){
  if(response == '[]') {
    document.getElementById("message").innerHTML = "引用している論文が0件でした。";
    return;
  }
  var json = JSON.parse(response);
  // 取得アルゴリズム
  console.log(json[0]);
  console.log(Object.keys(json).length)
  var tmp_array = [...Array(Object.keys(json).length)].map((_, i) => i);
  arrayShuffle(tmp_array);
  var target = json[0];
  var addflg = 0;
  for(var i = 0 ; i < tmp_array.length ; i++){
    target = json[tmp_array[i]];
    if( !dois.includes(target.cited) ){
      addflg = 1;
      break;
    }
  }
  if(addflg == 0) {
    document.getElementById("message").innerHTML = "追加できる論文がありませんでした。";
    return;
  }
  var cited = target.cited;
  var citing = target.citing;
  console.log("cited:"+cited+"  citing:"+citing);
  
  try {
    var url = 'https://opencitations.net/index/coci/api/v1/metadata/'+cited;
    var xhr = new XMLHttpRequest();
    xhr.open('GET', url, true);
    xhr.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');
    xhr.onreadystatechange = function() {
      try {
        if(xhr.readyState == 4) {
          if(xhr.status == 200) {
            var json2 = JSON.parse(xhr.responseText);
            var title = json2[0].title;
            var year = json2[0].year;
            var doi = json2[0].doi;
            var author = json2[0].author;
            var source_title = json2[0].source_title;
            console.log("title:"+title+"\nyear:"+year+"\ndoi:"+doi+"\nauthor:"+author+"\nsource_title:"+source_title);
            //if(!years.includes(year)){
            //  cy.add({group:'nodes',data:{id: year, color1: '#EDEDED'}});
            //  years.push(year);
            //}
            cy.add({group:'nodes',data:{id: doi, no: cy.$('node[year]').length+1, title: title, color1: '#FFA41B', year: year, EN: 'title' , author: author ,source_title: source_title}});
            dois.push(doi);
            cy.add({group:'edges',data: {source: cited, target: citing}});
            cy.layout({name:'dagre'}).run();
            cy.fit();
            drawTabulator();
            document.getElementById("message").innerHTML = "　";
          } else {
            throw new Error("error");
          }
        }
      } catch (e) {
        document.getElementById("message").innerHTML = "論文が取得できませんでした。やり直してみてください。";
        return;
      }
    }
    xhr.send();
  } catch(e) {
    document.getElementById("message").innerHTML = "論文が取得できませんでした。やり直してみてください。";
    return;
  }
}

function getCited(doi) {
  console.log("cited:"+doi);
  //cited
  try {
    var url = 'https://opencitations.net/index/coci/api/v1/citations/'+doi;
    var xhr = new XMLHttpRequest();
    xhr.open('GET', url, true);
    xhr.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');
    xhr.onreadystatechange = function() {
      try {
        if(xhr.readyState == 4) {
          if(xhr.status == 200) {
            addCitedNode(xhr.responseText);
          } else {
            throw new Error("error");
          }
        }
      } catch (e) {
        document.getElementById("message").innerHTML = "論文が取得できませんでした。やり直してみてください。";
        return;
      }
    }
    xhr.send();
  } catch(e) {
    document.getElementById("message").innerHTML = "論文が取得できませんでした。やり直してみてください。";
    return;
  }
}

function addCitedNode(response){
  if(response == '[]') {
    document.getElementById("message").innerHTML = "引用されている論文が0件でした。";
    return;
  }
  var json = JSON.parse(response);
  // 取得アルゴリズム
  console.log(json[0]);
  console.log(Object.keys(json).length)
  var tmp_array = [...Array(Object.keys(json).length)].map((_, i) => i);
  arrayShuffle(tmp_array);
  var target = json[0];
  var addflg = 0;
  for(var i = 0 ; i < tmp_array.length ; i++){
    target = json[tmp_array[i]];
    if( !dois.includes(target.citing) ){
      addflg = 1;
      break;
    }
  }
  if(addflg == 0) {
    document.getElementById("message").innerHTML = "追加できる論文がありませんでした。";
    return;
  }
  var cited = target.cited;
  var citing = target.citing;
  console.log("cited:"+cited+"  citing:"+citing);
  
  try {
    var url = 'https://opencitations.net/index/coci/api/v1/metadata/'+citing;
    var xhr = new XMLHttpRequest();
    xhr.open('GET', url, true);
    xhr.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');
    xhr.onreadystatechange = function() {
      try {
        if(xhr.readyState == 4) {
          if(xhr.status == 200) {
            var json2 = JSON.parse(xhr.responseText);
            var title = json2[0].title;
            var year = json2[0].year;
            var doi = json2[0].doi;
            var author = json2[0].author;
            var source_title = json2[0].source_title;
            console.log("title:"+title+"\nyear:"+year+"\ndoi:"+doi+"\nauthor:"+author+"\nsource_title:"+source_title);
            //if(!years.includes(year)){
            //  cy.add({group:'nodes',data:{id: year, color1: '#EDEDED'}});
            //  years.push(year);
            //}
            cy.add({group:'nodes',data:{id: doi, no: cy.$('node[year]').length+1, title: title, color1: '#FFA41B', year: year, EN: 'title' , author: author ,source_title: source_title}});
            dois.push(doi);
            cy.add({group:'edges',data: {source: cited, target: citing}});
            cy.layout({name:'dagre'}).run();
            cy.fit();
            drawTabulator();
            document.getElementById("message").innerHTML = "　";
          } else {
            //alert("error:" + xhr.status + "," + xhr.responseText);
          }
        }
      } catch (e) {
        document.getElementById("message").innerHTML = "論文が取得できませんでした。やり直してみてください。";
        return;
      }
    }
    xhr.send();
  } catch(e) {
    document.getElementById("message").innerHTML = "論文が取得できませんでした。やり直してみてください。";
    return;
  }
}


function drawTabulator(){
	//初期化
	tabulator_data = [];
	//nodeの論文データ取得
	cy.$('node[year]').forEach(function(ele){tabulator_data.push({id:ele.data("id"), no:ele.data("no"),title:ele.data("title"), year:ele.data("year"), author:ele.data("author"), source_title:ele.data("source_title")})})

	var tabulator_table = new Tabulator("#list", {
	 	height:350, 
	 	data:tabulator_data, 
	 	//layout:"fitColumns", 
	 	columns:[ //Define Table Columns
			{title:"No", field:"no", width:55},
			{title:"DOI", field:"id", formatter:"link" , formatterParams:{urlPrefix:"https://doi.org/"}, width:200},
			{title:"title", field:"title", width:400, formatter:"textarea"},
			{title:"year", field:"year", width:70},
			{title:"author", field:"author", width:400, formatter:"textarea"},
			{title:"source_title", field:"source_title", width:400, formatter:"textarea"},
	 	],
	 	//resizableRows:true,
	});
}

//PNG DL
function downloadPng(){
	var png64 = cy.png();
	// put the png data in an img tag
	//document.querySelector('#png_out').setAttribute('src', png64);
	var option = {
	    output: "blob",
	    scale: 10,
	};
	var blob = new Blob([
	    cy.png(option)
	], {'type': 'application/octet-stream'});

	var a = document.createElement('a');
	var url = window.URL.createObjectURL(blob);
	document.body.appendChild(a);
	a.href = url;
	a.download = 'output.jpg';
	a.click();
	a.remove();
	URL.revokeObjectURL(url);
}


//viewReport
function viewReport(){
	var url = "https://katsutaro.shinyapps.io/lodc2021/?dois=" + dois.join('__');
	console.log("URL:"+url);
	window.open(url);
}


function reDraw(){
  cy.layout({name:'dagre'}).run();
  cy.fit();
}

