
class Report {
  pages = [];
  def = null;
  keys = null;
  sums = [] ; 
  partialSum=[]; //menampung hasil total dan seluruh sub total
  constructor(msg) {
    this.def = msg;
    this.keys = new Array(this.def.level);
    for(var i = 0; i < this.def.cols.length ; ++i) {
      var cdf = this.def.cols[i];
      if(cdf.hasOwnProperty("key")){
          this.keys[cdf.key] = i ;  
        }
      if(cdf.hasOwnProperty("summary")){
          cdf.summary = 0;
          this.sums.push({ cdf: cdf, index: i });  
        }
    }
    this.partialSum = Array.from({ length: this.keys.length }, //inisiasi partialSum
            () => Array(this.sums.length).fill(0)); //indeks 0 untuk total, 1 untuk subTotal pertama dst.
    console.log(this.partialSum.length);
    this.render(msg2);
    console.log(this.partialSum);
    
  }

  render(rec) {
    var nextValues = new Array(this.keys.length).fill(null); 
    var p = new Page(this.def, document.body, this);
    this.pages.push(p);
    
    if (Array.isArray(rec.rows)) {
      for (var i = 0; i < rec.rows.length; ++i) {
        
        for (var j = 0; j < this.sums.length; ++j) {
          let sum = this.sums[j];
          let colIndex = sum.index;
          sum.cdf.summary += rec.rows[i].cols[colIndex];
          for(let k=0; k< this.partialSum.length; k++){ //menjumlahkann semua
            this.partialSum[k][j]+=rec.rows[i].cols[colIndex];          
          }
        }
        
        console.log(this.sums);
        var row = p.renderRowDetail(rec.rows[i]);

        for (let j = this.keys.length-1; j >=0; j--) {
            let nextRowExists = i < rec.rows.length - 1;
            nextValues[j] = nextRowExists ? rec.rows[i + 1].cols[this.keys[j]] : null;

            if (rec.rows[i].cols[this.keys[j]] !== nextValues[j]) {
              console.log(this.partialSum[this.keys[j]]);
              for(let summarySum = 0; summarySum< this.sums.length; summarySum++){
                this.sums[summarySum].cdf.summary = this.partialSum[this.keys[j] ?? 0][summarySum];
              }
              p.renderRowFooter();
              this.resetSummary(this.keys[j]); 
            }
        }
    
        if (row) {
          p = new Page(this.def, document.body);
          this.pages.push(p);
          p.renderRowDetail(row);
        }
      }
    }
  }
  
  resetSummary(index) {
    if (index >= 0 && index < this.partialSum.length) {
      this.partialSum[index] = this.partialSum[index].map(() => 0);
    }
}

}

class Page {
  report = null;
  dom = null;
  def = null;
  content = null;
  header = null;
  footer = null;
  max = 0;
  pad = 48;

  constructor(msg, dom, report) {
    this.report = report;
    this.def = msg;
    this.dom = dom.appendChild(document.createElement("div"));
    this.dom.className = "page";
    var pageHeight = this.dom.offsetHeight;
    var pageTop = this.dom.offsetTop;
    this.renderPageHeader();
    this.renderPageContent(msg);
    this.renderPageFooter();
    this.dom.style.padding = this.pad+"px";
    this.max = (pageHeight - this.header.offsetHeight - this.content.offsetHeight - this.footer.offsetHeight) 
                - this.pad ;
    this.content.style.height = this.max +"px";
    this.max = this.max-24;
  }

  renderPageContent(msg) {
      this.content = this.dom.appendChild(document.createElement("div"));
      this.content.className = "content";
      this.renderRowHeader();
      var contentHeight = this.content.offsetHeight;
  }

  renderPageHeader() {
    this.header = this.dom.appendChild(document.createElement("div"));
    this.header.className = "header";
    var hed = this.header.appendChild(document.createElement("div"))
    hed.innerHTML = "HEADER"
    hed.setAttribute('align', 'center');
    var headerHeight = this.header.offsetHeight;
  }

  renderRowHeader() {
      var header = this.content.appendChild(document.createElement("div"));
      header.className = "row-head";
      for(var i = 0; i < this.def.cols.length ; ++i) {
        var cdf = this.def.cols[i];
        var col = header.appendChild(document.createElement("div"));
        col.innerHTML = cdf.caption;
        col.style.textAlign = cdf.align ?? ""; 
      }
  }
  
  renderRowDetail(rec) {
      if(rec instanceof HTMLElement) this.content.appendChild(rec);
      else {
        var row = this.content.appendChild(document.createElement("div"));
        row.className = 'row';
        row.id = rec.id;
        for(var i = 0; i < this.def.cols.length; ++i) {
          var cdf = this.def.cols[i];
          var col = row.appendChild(document.createElement("div"))
          col.style.textAlign = cdf.align ?? "";
          col.innerHTML = rec.cols[i];
        }
        if(col.offsetTop+col.offsetHeight > this.max) return row;
      }
  }

  renderRowFooter() {
    var rowFooter = this.content.appendChild(document.createElement("div"));
    rowFooter.className = "row-footer";
    for(var i = 0; i < this.def.cols.length ; i++) {
      var cdf = this.def.cols[i];
      var fcol = rowFooter.appendChild(document.createElement("div"));
       if(cdf.hasOwnProperty("summary")){
        fcol.innerHTML = cdf.summary;
      } 
      fcol.style.textAlign = cdf.align ?? ""; 
    }
  }
  
  renderPageFooter() {
    this.footer = this.dom.appendChild(document.createElement("div"));
    this.footer.className = "footer";
    var fot = this.footer.appendChild(document.createElement("div"))
    fot.innerHTML = "FOOTER"
    fot.setAttribute('align', 'center');
    var footerHeight = this.footer.offsetHeight;
  } 
}

var msg = {
  id:125,
  title:"Payment Report by Vendor",
  cols:
    [
      { caption:"ID", field:"id", align:"center", type:1, width:80},
      { caption:"District", field:"district", align:"center", type:1, width:30, key:1},
      { caption:"Location", field:"location", align:"left", type:1, width:30,key:2},
      { caption:"Type", field:"Type", align:"left", type:1, width:30, key:3},
      { caption:"Description", field:"description", align:"left", type:2, width:180},
      { caption:"Contracted", field:"contracted", align:"right", type:2, width:150, summary:true },
      { caption:"Potential Renewal", field:"potential_renewal", align:"right", type:2, width:150, summary:true  },
      { caption:"Amount", field:"amount", align:"right", type:1, width:150, summary:true }
    ],
  level:3
}

var msg2 = {
  rows:
  [
    {"id":1,"cols":["1","IC01","PIT","A","RKAB",100,100,200]},
    {"id":2,"cols":["2","IC01","PIT","B","Export",100,100,200]},
    {"id":3,"cols":["3","IC01","PORT","C","Electricity",100,100,200]},
    {"id":4,"cols":["4","KM01","PIT","A","RKAB",100,100,200]},
    {"id":5,"cols":["5","KM01","PIT","B","Export",100,100,200]},
    {"id":6,"cols":["6","KM01","PORT","C","Electricity",100,100,200]} 
  ] 
}

window.addEventListener("load", e => {
  var r = new Report(msg);
});
