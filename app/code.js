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
                'content': 'data(title)',
                'width': '200',
                'height': '200',
                'text-opacity': 4,
                'text-valign': 'center',
                'text-halign': 'center',
                'font-size': '80',
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
                'target-arrow-shape': 'triangle',
                'line-color': '#9818D6',
                'target-arrow-color': '#9818D6',
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
            var json2 = JSON.parse(xhr.responseText);
            var title = json2[0].title;
            var year = json2[0].year;
            var doi = json2[0].doi;
            var author = json2[0].author;
            var source_title = json2[0].source_title;
            console.log("title:"+title+"\nyear:"+year+"\ndoi:"+doi+"\nauthor:"+author+"\nsource_title:"+source_title);
            if(!years.includes(year)){
              cy.add({group:'nodes',data:{id: year, color1: '#EDEDED'}});
              years.push(year);
            }
            cy.add({group:'nodes',data:{id: doi, title: title, color1: '#FF5151', parent: year, EN: 'title' , author: author ,source_title: source_title}});
            dois.push(doi);
            cy.layout({name:'dagre'}).run();
            cy.fit();
            drawTabulator();
          } else {
            //alert("error:" + xhr.status + "," + xhr.responseText);
            //throw new Error("error");
          }
        }
      } catch (e) {
        document.getElementById("status").innerHTML = "論文が取得できませんでした。やり直してみてください。";
      }
    }
    xhr.send();
  } catch(e) {
    document.getElementById("status").innerHTML = "論文が取得できませんでした。やり直してみてください。";
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
  var url = 'https://opencitations.net/index/coci/api/v1/references/'+doi;
  var xhr = new XMLHttpRequest();
  xhr.open('GET', url, true);
  xhr.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');
  xhr.onreadystatechange = function() {
    if(xhr.readyState == 4) {
      if(xhr.status == 200) {
        addCitingNode(xhr.responseText);
      } else {
      //alert("error:" + xhr.status + "," + xhr.responseText);
      }
    }
  }
  xhr.send();
}

function addCitingNode(response){
  var json = JSON.parse(response);
  // 取得アルゴリズム
  console.log(json[0]);
  console.log(Object.keys(json).length)
  var tmp_array = [...Array(Object.keys(json).length)].map((_, i) => i);
  arrayShuffle(tmp_array);
  var target = json[0];
  for(var i = (tmp_array.length - 1); 0 < i; i--){
    target = json[tmp_array[i]];
    if( !dois.includes(target.cited) ){
      break;
    }
  }
  var cited = target.cited;
  var citing = target.citing;
  console.log("cited:"+cited+"  citing:"+citing);
  
  var url = 'https://opencitations.net/index/coci/api/v1/metadata/'+cited;
  var xhr = new XMLHttpRequest();
  xhr.open('GET', url, true);
  xhr.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');
  xhr.onreadystatechange = function() {
    if(xhr.readyState == 4) {
      if(xhr.status == 200) {
        var json2 = JSON.parse(xhr.responseText);
        var title = json2[0].title;
        var year = json2[0].year;
        var doi = json2[0].doi;
        var author = json2[0].author;
        var source_title = json2[0].source_title;
        console.log("title:"+title+"\nyear:"+year+"\ndoi:"+doi+"\nauthor:"+author+"\nsource_title:"+source_title);
        if(!years.includes(year)){
          cy.add({group:'nodes',data:{id: year, color1: '#EDEDED'}});
          years.push(year);
        }
        cy.add({group:'nodes',data:{id: doi, title: title, color1: '#FFA41B', parent: year, EN: 'title' , author: author ,source_title: source_title}});
        dois.push(doi);
        cy.add({group:'edges',data: {source: cited, target: citing}});
        cy.layout({name:'dagre'}).run();
        cy.fit();
        drawTabulator();
      } else {
        //("error:" + xhr.status + "," + xhr.responseText);
      }
    }
  }
  xhr.send();
}

function getCited(doi) {
  console.log("cited:"+doi);
  //cited
  var url = 'https://opencitations.net/index/coci/api/v1/citations/'+doi;
  var xhr = new XMLHttpRequest();
  xhr.open('GET', url, true);
  xhr.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');
  xhr.onreadystatechange = function() {
    if(xhr.readyState == 4) {
      if(xhr.status == 200) {
        addCitedNode(xhr.responseText);
      } else {
      //alert("error:" + xhr.status + "," + xhr.responseText);
      }
    }
  }
  xhr.send();
}

function addCitedNode(response){
  var json = JSON.parse(response);
  // 取得アルゴリズム
  console.log(json[0]);
  console.log(Object.keys(json).length)
  var tmp_array = [...Array(Object.keys(json).length)].map((_, i) => i);
  arrayShuffle(tmp_array);
  var target = json[0];
  for(var i = (tmp_array.length - 1); 0 < i; i--){
    target = json[tmp_array[i]];
    if( !dois.includes(target.cited) ){
      break;
    }
  }
  var cited = target.cited;
  var citing = target.citing;
  console.log("cited:"+cited+"  citing:"+citing);
  
  var url = 'https://opencitations.net/index/coci/api/v1/metadata/'+citing;
  var xhr = new XMLHttpRequest();
  xhr.open('GET', url, true);
  xhr.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');
  xhr.onreadystatechange = function() {
    if(xhr.readyState == 4) {
      if(xhr.status == 200) {
        var json2 = JSON.parse(xhr.responseText);
        var title = json2[0].title;
        var year = json2[0].year;
        var doi = json2[0].doi;
        var author = json2[0].author;
        var source_title = json2[0].source_title;
        console.log("title:"+title+"\nyear:"+year+"\ndoi:"+doi+"\nauthor:"+author+"\nsource_title:"+source_title);
        if(!years.includes(year)){
          cy.add({group:'nodes',data:{id: year, color1: '#EDEDED'}});
          years.push(year);
        }
        cy.add({group:'nodes',data:{id: doi, title: title, color1: '#FFA41B', parent: year, EN: 'title' , author: author ,source_title: source_title}});
        dois.push(doi);
        cy.add({group:'edges',data: {source: cited, target: citing}});
        cy.layout({name:'dagre'}).run();
        cy.fit();
        drawTabulator();
      } else {
        //alert("error:" + xhr.status + "," + xhr.responseText);
      }
    }
  }
  xhr.send();
}

// nodeのpopup
var makeTippy = function(node, text) {
    var ref = node.popperRef();
    var dummyDomEle = document.createElement('div');
    return tippy(dummyDomEle, {
        getReferenceClientRect: ref.getBoundingClientRect,
        trigger: 'manual',
        content: function() {
            var title = node.data('title');
            var doi = node.data('id').replace(/\*$/, "");
            var year = node.data('parent');
            var div = document.createElement('div');
                div.innerHTML = '<p>'+ title +'</p><p>doi : <a href = "https://doi.org/' + doi + '" target="_blank">' + doi + '</a></p><p>year : ' + year + '</p><p><form><input type="button" id="'+doi+'" value="この論文が引用している論文を探す" onclick="getCiting(this.id)" ></form></p><p><form><input type="button" id="'+doi+'" value="この論文を引用している論文を探す" onclick="getCited(this.id)" ></form></p>';
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
    if (e.target.data('parent') !== undefined) {
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

function drawTabulator(){
	//初期化
	tabulator_data = [];
	//nodeの論文データ取得
	cy.$('node[parent]').forEach(function(ele){tabulator_data.push({id:ele.data("id"), title:ele.data("title"), year:ele.data("parent"), author:ele.data("author"), source_title:ele.data("source_title")})})

	var tabulator_table = new Tabulator("#list", {
	 	height:200, 
	 	data:tabulator_data, 
	 	//layout:"fitColumns", 
	 	columns:[ //Define Table Columns
		 	{title:"DOI", field:"id", formatter:"link" , formatterParams:{urlPrefix:"https://doi.org/"}},
		 	{title:"title", field:"title"},
		 	{title:"year", field:"year"},
			{title:"author", field:"author"},
			{title:"source_title", field:"source_title"},
	 	],
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


