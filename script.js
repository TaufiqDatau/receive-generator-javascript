
class Report {
  pages = [];
  def = null;
  keycdf=[];
  keys = null;
  sums = [] ; 
  partialSum=[]; //menampung hasil total dan seluruh sub total
  constructor(msg) {
    this.def = msg;
    this.keys = new Array(this.def.level);
    this.initializeKeysAndSums();
    this.render(msg2);
    
  }

  initializeKeysAndSums(){
    this.def.cols.forEach((cdf, i) => {
      if (cdf.hasOwnProperty("key")) {
        this.keys[cdf.key] = i;
        this.keycdf[cdf.key]=cdf;
      }
    
      if (cdf.hasOwnProperty("summary")) {
        cdf.summary = 0;
        this.sums.push({ cdf, index: i });
      }
    });
    
    this.partialSum = Array.from({ length: this.keys.length }, () =>
      Array(this.sums.length).fill(0)
    );
    
  }
  render(rec) {
    const nextValues = new Array(this.keys.length).fill(null);
    let currentPage = this.createPage(); //currentIndex

    if (Array.isArray(rec.rows)) {
      for (let i = 0; i < rec.rows.length; i++) {
        this.updateSumsAndPartialSum(rec.rows[i]);
        const row = currentPage.renderRowDetail(rec.rows[i]);
        this.updateAndRenderFooter(i, rec.rows, nextValues, row);
      }
    }
  }

  createPage() {
    const page = new Page(this.def, document.body, this);
    this.pages.push(page);
    return page;
  }

  updateSumsAndPartialSum(row) {
    for (let j = 0; j < this.sums.length; ++j) {
      const { cdf, index } = this.sums[j];
      
      this.partialSum.forEach((partial, k) => {
        
        partial[j] += row.cols[index];
        
      });

    }
  }

  updateAndRenderFooter(i, rows, nextValues, row) {
    const currentPage = this.pages[this.pages.length - 1];

    for (let j = this.def.cols.length - 1; j >= 0; j--) {
      if(this.def.cols[j].hasOwnProperty("key") || j==0){
        let index = this.def.cols[j].key;
        const nextRowExists = i < rows.length - 1;
        nextValues[index] = nextRowExists ? rows[i + 1].cols[this.keys[index]] : null;

        if (row && row !== undefined && row.offsetTop + row.offsetHeight > currentPage.max) {
          return;
        }

        if (rows[i].cols[this.keys[index]] !== nextValues[index]) {
          this.updateSummaryAndRenderFooter(currentPage, index ?? 0, rows[i].cols[this.keys[index]]);
          this.resetSummary(this.keys[index]);
        }
      }
      
    }

    if (row) {
      this.createNextPageAndRenderRow(row);
    }
  }

  updateSummaryAndRenderFooter(currentPage, j,identity) {
    this.sums.forEach((sum, summarySum) => {
      sum.cdf.summary = this.partialSum[this.keys[j] ?? 0][summarySum];
    });  
    if(j!==0){
      currentPage.renderRowFooter(this.keycdf[this.keys[j]??1].caption + `: ${identity}`,j ); //Mencetak footer
    }else{
      currentPage.renderRowFooter("Total",j);//pembaruan branch b
    } 
  }

  createNextPageAndRenderRow(row) {
    const nextRow = this.createPage();
    nextRow.renderRowDetail(row);
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
    this.calculateMaxHeight();
  }

  calculateMaxHeight() {
    const pageHeight = this.dom.offsetHeight;
  
    this.max = (pageHeight - this.header.offsetHeight - this.content.offsetHeight - this.footer.offsetHeight) - this.pad;
    this.content.style.height = this.max + "px";
    this.max = this.max - 24;
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

  renderRowFooter(context,j) {
    var rowFooter = this.content.appendChild(document.createElement("div"));
    rowFooter.className = "row-footer";
    for(var i = 0; i < this.def.cols.length ; i++) {
      var cdf = this.def.cols[i];
      var fcol = rowFooter.appendChild(document.createElement("div"));
       if(cdf.hasOwnProperty("summary") ){
        fcol.innerHTML = cdf.summary;
      }
      else if(cdf.caption=="District" && j!==0){
        fcol.innerHTML = `Sub Total`
      } 
      else if(cdf.caption=="Location"){
        fcol.innerHTML = `${context}`;
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
      { caption:"District", field:"district", align:"center", type:1, width:40, key:2},
      { caption:"Location", field:"location", align:"left", type:1, width:40,key:1},
      { caption:"Description", field:"description", align:"left", type:2, width:180},
      { caption:"Contracted", field:"contracted", align:"right", type:2, width:150, summary:true },
      { caption:"Potential Renewal", field:"potential_renewal", align:"right", type:2, width:150 },
      { caption:"Amount", field:"amount", align:"right", type:1, width:150, summary:true }
    ],
  level:3
}

var msg2 = {
  rows:
  [
    {"id":1,"cols":["1","IC01","PIT","RKAB",100,100,200]},
    {"id":2,"cols":["2","IC01","PIT","Export",100,100,200]},
    {"id":3,"cols":["3","IC01","PORT","Electricity",100,100,200]},
    {"id":4,"cols":["4","KM01","PIT","RKAB",100,100,200]},
    {"id":5,"cols":["5","KM01","PIT","Export",100,100,200]},
    {"id":6,"cols":["6","KM01","PORT","Electricity",100,100,200]},
    {"id":7,"cols":["7","IC02","PIT","RKAB",150,120,270]},
    {"id":8,"cols":["8","IC02","PIT","Export",120,90,210]},
    {"id":9,"cols":["9","IC02","PORT","Electricity",200,180,380]},
    {"id":10,"cols":["10","KM02","PIT","RKAB",80,70,150]},
    {"id":11,"cols":["11","KM02","PIT","Export",110,80,190]},
    {"id":12,"cols":["12","KM02","PORT","Electricity",250,200,450]},
    {"id":13,"cols":["13","IC03","PIT","RKAB",130,110,240]},
    {"id":14,"cols":["14","IC03","PIT","Export",90,70,160]},
    {"id":15,"cols":["15","IC03","PORT","Electricity",180,160,340]},
    {"id":16,"cols":["16","KM03","PIT","RKAB",120,100,220]}
  ] 
}

window.addEventListener("load", e => {
  var r = new Report(msg);
});
