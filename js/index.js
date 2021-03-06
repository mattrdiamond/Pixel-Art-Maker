$(function () {
  let activeTool = null;
  let activeModal = null;
  let mouseDragging = false;
  const $colorPicker = $(".color-picker");
  const $gridPicker = $(".grid-picker");
  const $table = $("#pixel-canvas");
  const $canvas = $("#canvas-container");
  const $inputWidth = $("#input-width");
  const $inputHeight = $("#input-height");
  const $gridMaxAlert = $(".grid-max-alert");
  const $sidebarContainer = $(".sidebar-container");
  const $flyoutIcon = $(".flyout-icon");

  // Get max number of pixels that will fit on screen (limit 100)
  function calculateMaxGrid() {
    const pixelSize = 20,
      limit = 100;
    let maxGridHeight = Math.floor($canvas.height() / pixelSize);
    let maxGridWidth = Math.floor($canvas.width() / pixelSize);

    return {
      maxHeight: maxGridHeight < limit ? maxGridHeight : limit,
      maxWidth: maxGridWidth < limit ? maxGridWidth : limit,
    };
  }

  function openModal(modal) {
    $("#" + modal).fadeIn(250);
    activeModal = modal;
  }

  function closeModal() {
    $("#" + activeModal).fadeOut(250);
    activeModal = null;
  }

  function getGridSize() {
    const { maxHeight, maxWidth } = calculateMaxGrid();
    let sliderHeight = $inputHeight.val();
    let sliderWidth = $inputWidth.val();

    if (sliderHeight > maxHeight || sliderWidth > maxWidth) {
      $gridMaxAlert.append(
        `Maximum grid size is ${maxWidth} pixels wide by ${maxHeight} pixels high.`
      );
      openModal("modal-grid-error");
    }
    return {
      height: sliderHeight,
      width: sliderWidth,
    };
  }

  function resetTable() {
    $table.empty();
  }

  function makeGrid(height, width) {
    const tbody = document.createElement("tbody");
    resetTable();
    for (let i = 0; i < height; i++) {
      const row = tbody.insertRow(i);
      for (let j = 0; j < width; j++) {
        row.insertCell(j);
      }
    }
    $table.append(tbody);
  }

  function activateTool(clickedTool) {
    if (activeTool && clickedTool === activeTool) return;

    if (activeTool) {
      $("#" + activeTool).removeClass("active");
    }

    $("#" + clickedTool).addClass("active");
    activeTool = clickedTool;

    if (activeTool === "download") {
      // only download if table is present
      return $table.children().length > 0
        ? openModal("modal-download")
        : openModal("modal-download-error");
    } else if ($table) {
      $table.attr("class", activeTool + "-active");
    }
  }

  function paintPixels(target) {
    let color;
    // apply color to cells to draw or erase
    if (activeTool === "eraser") {
      color = "#ffffff";
    } else {
      color = $colorPicker.spectrum("get").toHexString();
    }
    $(target).css("background", color);
  }

  function setGridColor() {
    const color = $gridPicker.spectrum("get").toHexString();
    $("td").css("border-color", color);
  }

  function setEyedropperVal(e) {
    const eyedropperValue = $(e.target).css("background-color");
    $colorPicker.spectrum("set", eyedropperValue);
  }

  //download a png of the table
  function saveImage() {
    html2canvas($canvas, {
      onrendered: function (canvas) {
        const dummylink = document.createElement("a");
        $(dummylink).attr("href", canvas.toDataURL("image/png"));
        $(dummylink).attr("download", "masterpiece.png");
        $(dummylink)[0].click();
      },
    });
  }

  function collapseSidebar() {
    if (
      (window.innerWidth > 700 || window.innerWidth < 425) &&
      !$sidebarContainer.hasClass("flyout")
    )
      return;
    $sidebarContainer.removeClass("flyout");
    $flyoutIcon.removeClass("open");
  }

  function handleResize() {
    const { maxHeight, maxWidth } = calculateMaxGrid();

    // update max attribute based on new screen size
    $inputHeight.attr("max", maxHeight);
    $inputWidth.attr("max", maxWidth);

    // set slider values to max amount
    $inputHeight.val(maxHeight).change();
    $inputWidth.val(maxWidth).change();

    // update range slider UI accordingly
    $inputHeight.rangeslider("update", true);
    $inputWidth.rangeslider("update", true);

    collapseSidebar();
  }

  function getElementFromPoint(e) {
    return document.elementFromPoint(
      e.originalEvent.changedTouches[0].clientX,
      e.originalEvent.changedTouches[0].clientY
    );
  }

  /*-----------------------
   * spectrum color picker
   *---------------------*/

  // set default pixel color
  $colorPicker.spectrum({
    color: "#a972dd",
  });

  $gridPicker.spectrum({
    show: function () {
      $(this).data("changed", false);
    },
    change: function () {
      $(this).data("changed", true);
    },
    move: function () {
      $(this).data("changed", true);
    },
    hide: function (color) {
      if ($(this).data("changed")) {
        $("td").css("border-color", color.toHexString());
      }
    },
  });

  /*-----------------------
   * range sliders
   *---------------------*/

  $(function initSliders() {
    $inputWidth.rangeslider({
      polyfill: false,
      // update text value when slider value changes
      onSlide: function (position, value) {
        $(".rangeslider--width").text(value);
      },
    });
    $("#input-height").rangeslider({
      polyfill: false,
      onSlide: function (position, value) {
        $(".rangeslider--height").text(value);
      },
    });
    // set default grid size to fill entire canvas
    handleResize();
  });

  /*-----------------------
   * events
   *---------------------*/

  //submit grid
  $("#size-picker").on("submit", function (e) {
    e.preventDefault();
    const { height, width } = getGridSize();
    if (!height || !width) return;
    makeGrid(height, width);
    setGridColor();
    activateTool("pencil");
    collapseSidebar();
  });

  //reset grid
  $(".reset-button").on("click", function () {
    resetTable();
  });

  $table.on("mousedown touchstart", "td", function (e) {
    if (activeTool === "pencil" || activeTool === "eraser") {
      // use elementFromPoint to get target on touch devices
      const target =
        e.type === "touchstart" ? getElementFromPoint(e) : e.target;

      mouseDragging = true;

      if (target.nodeName != "TD") return;
      paintPixels(target);
    }
    // disable drag and drop
    e.preventDefault ? e.preventDefault() : (e.returnValue = false);
    collapseSidebar();
  });

  $table.on("mousemove mouseover mouseenter", "td", function (e) {
    if (mouseDragging) {
      paintPixels(e.target);
    }
  });

  $table.on("touchmove", "td", function (e) {
    if (mouseDragging) {
      const target = getElementFromPoint(e);
      if (!target || target.nodeName != "TD") return;
      paintPixels(target);
    }
  });

  $table.on("mouseup mouseleave touchend", function (e) {
    mouseDragging = false;
    if (activeTool === "eyedropper") {
      setEyedropperVal(e);
    }
  });

  // double click to erase
  $table.dblclick(function (e) {
    $(e.target).css("background-color", "#fff");
  });

  //change drawing color to swatch value
  $("#swatch-container").on("click", ".swatches", function () {
    switch ($(this).attr("id")) {
      case "red-swatch":
        $colorPicker.spectrum("set", "#fd566a");
        break;
      case "orange-swatch":
        $colorPicker.spectrum("set", "#feaa19");
        break;
      case "yellow-swatch":
        $colorPicker.spectrum("set", "#fffd33");
        break;
      case "green-swatch":
        $colorPicker.spectrum("set", "#97eb71");
        break;
      case "blue-swatch":
        $colorPicker.spectrum("set", "#47d0d0");
        break;
      case "violet-swatch":
        $colorPicker.spectrum("set", "#a972dd");
        break;
    }
  });

  // activate drawing tool
  $("#drawing-tools").on("click", "svg", (e) => {
    const clickedTool = e.target.id;
    activateTool(clickedTool);
  });

  //flyout sidebar activation using hamburger button
  $flyoutIcon.on("click", function () {
    $(this).toggleClass("open");
    $sidebarContainer.toggleClass("flyout");
  });

  // window resize handler
  $(window).on("resize", $.debounce(400, handleResize));

  $(".modal-submit").on("click", function () {
    if (activeModal === "modal-download") {
      saveImage();
      activateTool("pencil");
    }
    closeModal();
  });

  $(".modal-cancel").on("click", function () {
    if (activeModal === "modal-grid-error") {
      // clear modal alert text after alert fades out
      setTimeout($gridMaxAlert.empty(), 500);
    }
    closeModal();
    activateTool("pencil");
  });
});
