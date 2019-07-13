let drawMode = false;
let eraseMode = false;
let eyedropperMode = false;
let downloadMode = false;
let mouseDragging = false;
const colorPicker = $(".color-picker");
const gridPicker = $(".grid-picker");
const eraserTool = $("#eraser");
const pencilTool = $("#pencil");
const eyedropperTool = $("#eyedropper");
const downloadTool = $("#download");
const table = $("#pixel-canvas");
const canvas = $("#canvas-container");
const inputWidth = $("#input-width");
const inputHeight = $("#input-height");
const modalDownload = $(".modal-download");
const modalError = $(".modal-error");
const modalGridMax = $(".modal-grid-max");
const gridMaxAlert = $(".grid-max-alert");

/*-----------------------
 * event listeners
 *---------------------*/

//submit grid
$("#size-picker").submit(function(evt) {
  evt.preventDefault();
  checkCanvasDimensions();
});

//reset grid
$(".reset-button").on("click", function() {
  resetTable();
});

// single click or click and drag to paint
table.on("click", "td", function(evt) {
  // collapse sidebar on small screens
  collapseSidebar();

  if (drawMode || eraseMode) {
    paintPixels(evt);
  }
  if (eyedropperMode) {
    getColorValue(evt);
    activatePencil();
  }
});

table.on("mousedown", "td", function() {
  mouseDragging = true;
});

table.on("mousemove mouseover mouseenter", "td", function(evt) {
  if ((mouseDragging && drawMode) || (mouseDragging && eraseMode)) {
    collapseSidebar();
    paintPixels(evt);
  }
  if (eyedropperMode) {
    $(this).addClass("eyedropper-mode");
    $(this).removeClass("draw-mode");
  } else {
    $(this).addClass("draw-mode");
    $(this).removeClass("eyedropper-mode");
  }
});

//change cursor for eyedropper tool
table.on("mousemove mouseover mouseenter", function(evt) {
  if (eyedropperMode) {
    $(this).css("cursor", "pointer");
  } else {
    $(this).css("cursor", "crosshair");
  }
});

// when mouse is released, dragging has stopped
$(document).on("mouseup mouseleave dragstart", function() {
  mouseDragging = false;
});

// double click to erase
table.dblclick(function(evt) {
  const color = colorPicker.spectrum("get").toHexString();
  $(evt.target).css("background-color", "#fff");
});

// activate/deactivate pencil tool
pencilTool.click(function() {
  if ($(this).attr("class") === "active") {
    $(this).attr("class", "inactive");
    drawMode = false;
  } else {
    activatePencil();
  }
});

// activate/deactivate eraser tool
eraserTool.click(function() {
  if ($(this).attr("class") === "active") {
    $(this).attr("class", "inactive");
    eraseMode = false;
    drawMode = false;
    eyedropperMode = false;
    downloadMode = false;
  } else {
    $(this).attr("class", "active");
    pencilTool.attr("class", "inactive");
    eyedropperTool.attr("class", "inactive");
    downloadTool.attr("class", "inactive");
    eraseMode = true;
    drawMode = false;
    eyedropperMode = false;
    downloadMode = false;
  }
});

// activate/deactivate eyedropper tool
eyedropperTool.click(function() {
  if ($(this).attr("class") === "active") {
    $(this).attr("class", "inactive");
    eraseMode = false;
    drawMode = false;
    eyedropperMode = false;
    downloadMode = false;
  } else {
    $(this).attr("class", "active");
    pencilTool.attr("class", "inactive");
    eraserTool.attr("class", "inactive");
    downloadTool.attr("class", "inactive");
    eyedropperMode = true;
    eraseMode = false;
    drawMode = false;
    downloadMode = false;
  }
});

// activate/deactivate download button
downloadTool.click(function() {
  if (table.children().length > 0) {
    $(this).attr("class", "active");
    pencilTool.attr("class", "inactive");
    eraserTool.attr("class", "inactive");
    eyedropperTool.attr("class", "inactive");
    downloadMode = true;
    eyedropperMode = false;
    eraseMode = false;
    drawMode = false;
    downloadPrompt();
  } else {
    downloadError();
  }
});

//modal: download image
$(".modal-submit").click(function() {
  modalDownload.fadeOut(500);
  saveImage();
  activatePencil();
});

//modal: cancel button
$(".modal-cancel").click(function() {
  modalDownload.fadeOut(500);
  modalError.fadeOut(500);
  modalGridMax.fadeOut(500);
  // clear modal alert text after alert fades out
  setTimeout(clearModalText, 1000);
  function clearModalText() {
    gridMaxAlert.empty();
  }
  activatePencil();
});

//change drawing color to swatch value
$("#swatch-container").on("click", ".swatches", function() {
  switch ($(this).attr("id")) {
    case "red-swatch":
      colorPicker.spectrum("set", "#fd566a");
      break;
    case "orange-swatch":
      colorPicker.spectrum("set", "#feaa19");
      break;
    case "yellow-swatch":
      colorPicker.spectrum("set", "#fffd33");
      break;
    case "green-swatch":
      colorPicker.spectrum("set", "#97eb71");
      break;
    case "blue-swatch":
      colorPicker.spectrum("set", "#47d0d0");
      break;
    case "violet-swatch":
      colorPicker.spectrum("set", "#a972dd");
      break;
  }
});

//respond to user resizing window
$(window).resize(function() {
  const availHeight = canvas.height();
  const availWidth = canvas.width();
  const resizeHeight = Math.floor(canvas.height() / 20);
  const resizeWidth = Math.floor(canvas.width() / 20);

  inputHeight.val(resizeHeight);
  inputWidth.val(resizeWidth);

  //update range sliders when resizing window
  inputHeight.rangeslider("update", true);
  inputWidth.rangeslider("update", true);

  //collapse sidebar on smaller screens
  if ($(window).width() <= 700) {
    $(".sidebar-container").removeClass("flyout");
    $(".flyout-icon").removeClass("open");
  }
});

//flyout sidebar activation using hamburger button
$(".flyout-icon").click(function() {
  $(this).toggleClass("open");
  $(".sidebar-container").toggleClass("flyout");
});

/*-----------------------
 * functions
 *---------------------*/

//check canvas dimensions
function checkCanvasDimensions() {
  let canvasHeight = canvas.height();
  let canvasWidth = canvas.width();
  let availableHeight = Math.floor(canvasHeight / 20);
  let availableWidth = Math.floor(canvasWidth / 20);
  const gridHeight = $("#input-height").val();
  const gridWidth = $("#input-width").val();

  /*-------------------*/
  console.log(`canvas height is ${canvasHeight}`);
  console.log(`canvas width is ${canvasWidth}`);
  console.log(`available Height is ${availableHeight}`);
  console.log(`available Width is ${availableWidth}`);
  console.log(`grid height is ${gridHeight}`);
  console.log(`grid width is ${gridWidth}`);
  /*-------------------*/

  //set available height/width to 100 for large screen sizes
  if (availableHeight > 100) {
    availableHeight = 100;
  }
  if (availableWidth > 100) {
    availableWidth = 100;
  }

  //check to see if screen size can accomodate user input value before creating grid
  if (availableHeight >= gridHeight && availableWidth >= gridWidth) {
    makeGrid();
    setGridColor();
    activatePencil();
  } else {
    gridMaxAlert.append(
      `Maximum grid size is ${availableWidth} pixels wide by ${availableHeight} pixels high.`
    );
    modalGridMax.fadeIn(500);
  }
}

// create grid
function makeGrid() {
  const gridHeight = $("#input-height").val();
  const gridWidth = $("#input-width").val();
  const tbody = document.createElement("tbody");

  resetTable();
  //old--------------------------------------------
  //   for(let i = 0; i < gridHeight; i++) {
  //     const row = $("<tr></tr>");
  //     for(let j = 0; j < gridWidth; j++) {
  //       const cell = $("<td></td>");
  //       row.append(cell);
  //     }
  //     table.append(row);
  //   }
  // }
  // ------------------------------------------------
  for (let i = 0; i < gridHeight; i++) {
    const row = tbody.insertRow(i);
    for (let j = 0; j < gridWidth; j++) {
      const cell = row.insertCell(j);
    }
  }
  table.append(tbody);
}

// reset table
function resetTable() {
  table.empty();
}

// activate pencil tool
function activatePencil() {
  if (
    eraserTool.attr("class", "active") ||
    eyedropperTool.attr("class", "active") ||
    downloadTool.attr("class", "active")
  ) {
    eraserTool.attr("class", "inactive");
    eyedropperTool.attr("class", "inactive");
    downloadTool.attr("class", "inactive");
    eraseMode = false;
    eyedropperMode = false;
  }
  pencilTool.attr("class", "active");
  drawMode = true;
}

// apply color to cells to draw or erase
function paintPixels(evt) {
  let color;
  if (eraseMode) {
    color = "#ffffff";
  } else {
    color = colorPicker.spectrum("get").toHexString();
  }
  $(evt.target).css("background", color);
}

//change grid color
function setGridColor() {
  const color = gridPicker.spectrum("get").toHexString();
  $("td").css("border-color", color);
}

//eyedropper tool - get color value
function getColorValue(evt) {
  const eyedropperValue = $(evt.target).css("background-color");
  colorPicker.spectrum("set", eyedropperValue);
}

// prompt user to download png of file
function downloadPrompt() {
  modalDownload.fadeIn(500);
}

//download a png of the table
function saveImage() {
  html2canvas(canvas, {
    onrendered: function(canvas) {
      const dummylink = document.createElement("a");
      $(dummylink).attr("href", canvas.toDataURL("image/png"));
      $(dummylink).attr("download", "masterpiece.png");
      $(dummylink)[0].click();
    }
  });
}

//hide sidebar when clicking on table (small screen sizes only)
function collapseSidebar() {
  const sidebar = $(".sidebar-container");
  const flyoutIcon = $(".flyout-icon");

  if (sidebar.hasClass("flyout")) {
    sidebar.toggleClass("flyout");
    flyoutIcon.toggleClass("open");
  }
}

// error modal if user clicks download without creating a grid first
function downloadError() {
  modalError.fadeIn(500);
}

/*-----------------------
 * spectrum color picker
 *---------------------*/
colorPicker.spectrum({
  color: "#a972dd"
});

gridPicker.spectrum({
  show: function() {
    $(this).data("changed", false);
  },
  change: function(color) {
    $(this).data("changed", true);
  },
  move: function(color) {
    $(this).data("changed", true);
  },
  hide: function(color) {
    if ($(this).data("changed")) {
      $("td").css("border-color", color.toHexString());
    }
  }
});

/*-----------------------
 * range sliders
 *---------------------*/

$(function() {
  //set default grid size to fill entire canvas
  inputHeight.val(Math.floor(canvas.height() / 20));
  inputWidth.val(Math.floor(canvas.width() / 20));

  $("#input-width").rangeslider({
    polyfill: false,
    onInit: function() {
      $(".rangeslider--width").text($("#input-width").val());
    },
    onSlide: function(position, value) {
      $(".rangeslider--width").text(value);
    }
  });
  $("#input-height").rangeslider({
    polyfill: false,
    onInit: function() {
      $(".rangeslider--height").text($("#input-height").val());
    },
    onSlide: function(position, value) {
      $(".rangeslider--height").text(value);
    }
  });
});
