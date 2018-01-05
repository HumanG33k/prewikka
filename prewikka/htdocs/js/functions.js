"use strict";

String.prototype.capitalize = function() {
    return this.charAt(0).toUpperCase() + this.slice(1);
};


$(function() {
  var $cache = null;
  var $cachef = null;

  $.fn.serializeObject = function() {
      var data = {};

      $.each($(this).serializeArray(), function(i, input) {
          data[input.name] = input.value;
      });

      return data;
  }

  $.fn.popupUnique = function(animshow, animhide) {
        if ( $cache && this.is(':visible') ) {
                $cachef($cache);
                $cache = null;
        } else {
                animshow(this);
                if ( $cache )
                        $cachef($cache);
                $cachef = animhide;
                $cache = this;
        }

        return false;
  };

  $.fn.check = function(mode){
        return this.each(function() { this.checked = mode; } );
  };

  $(document).on("reload", "#main", function() {
      return prewikka_ajax({ url: prewikka_location().href });
  });

  $(document).on("click", ".popup_menu_toggle", function(){
    $(this).next().popupUnique(function(data){data.show('fast'); data.css('display','block')}, function(data){data.hide('fast')});
  });

  $(document).on("show.bs.popover", '[data-toggle="popover"]', function() {
    $('[data-toggle="popover"]').not(this).popover("hide");
  });

  $(document).on("hidden.bs.popover", '[data-toggle="popover"]', function() {
    // See https://github.com/twbs/bootstrap/issues/16732
    $(this).data("bs.popover").inState.click = false;
  });

  $(document).on("click", "#logout", function() {
    this.href = "logout?redirect=" + encodeURIComponent(location.href);
  });

  $(document).on("click", ".prewikka-help-button", function(event) {
    /*
     * Prevent default link event handler execution
     */
    event.stopImmediatePropagation();

    window.open($(this).data("href"), "_prewikka_help", "width=600,height=600,location=no,menubar=no,toolbar=no,scrollbars=yes").focus();
    return false;
  });

// Repeatable entries

  $(document).on("click", ".del_entry_row", function() {
      var row = $(this).parents(".repeat-entry");
      if ( row.siblings(".repeat-entry").length > 0 )
          row.remove();
      else
          row.trigger("reset_row");
      return false;
  });

  $(document).on("click", ".add_entry_row", function() {
      var row = $(this).parents(".repeat-entry");
      var newrow = row.clone();
      row.after(newrow);
      newrow.trigger("reset_row");
      return false;
  });

  $(document).on("keypress", ".modal", function(e) {
      if ( e.keyCode == $.ui.keyCode.ENTER ) {
          $(this).find(".btn-primary").first().click();
          return false;
      }
  });

  $(document).on('click', '[data-confirm]', function() {
      var input = $(this);
      var confirm = input.data("confirm");

      function confirm_handler() {
          input.removeData("confirm").removeAttr('data-confirm');

          /*
           * Simulate a click using the DOM's native click() method
           * as jQuery's function does not work properly on "a" tags.
           * See http://stackoverflow.com/a/21762745 for more information.
           */
          input[0].click();
          input.attr("data-confirm", confirm).data("confirm", confirm);
          $('#prewikka-dialog-confirm').modal('hide');
          return false;
      }

      // Remove the handler in case it was already set. And set the correct handler
      $('#prewikka-dialog-confirm-OK').off("click").on("click", confirm_handler);

      prewikka_dialog({message: confirm, type: "confirm"});
      return false;
  });

  $("#top_view_navbar .dropdown a").click(function() {
      $(this).closest(".dropdown-menu").prev().dropdown("toggle");
  });

  $('ul.dropdown-menu [data-toggle=dropdown]').on('click', function() {
      $(this).closest(".dropdown-submenu").toggleClass("open");
      return false;
  });

  function _position_dropdown(elem, selector) {
      // Allow dropdowns expanding out of the modal
      // Setting "top: auto; left: auto" works only with Firefox
      var modal = elem.closest(".modal-content:visible");
      elem.find(selector).css({
          position: "fixed",
          top: elem.offset().top - modal.offset().top + elem.height(),
          left: elem.offset().left - modal.offset().left
      });
  }

  $(document).on('show.bs.dropdown', '.modal-content:visible .dropdown-fixed', function() {
      _position_dropdown($(this), ".dropdown-menu");
  });

  $(document).on('chosen:showing_dropdown', '.modal-content:visible select', function() {
      _position_dropdown($(this).siblings(".chosen-container"), ".chosen-drop");
  });

  $(document).on('click', '.popup_menu_dynamic', function() {
      $(this).removeClass("popup_menu_dynamic");

      if ( ! $(this).data("popup-url") )
          return;

      var popup_menu = $(this).next(".popup_menu");
      popup_menu.append($("<span>", {
        "class": "popup_menu_loading",
        "text": "Loading..."
      }));

      prewikka_ajax({
          spinner: false,
          type: "GET",
          url: $(this).data("popup-url"),
          success: function(data) {
              popup_menu.find(".popup_menu_loading").remove();
              popup_menu.append(data.join(""));
          }
      });
  });

  $(document).on('click', '#prewikka-notification .close', function() {
    $("#prewikka-notification").hide();
  });

  /*
   * Make sure bootstrap modal appear in the order they are drawn (as opposed to html order).
   */
  $(document).on('show.bs.modal', '.modal', function () {
    var zIndex = 1050 + $('.modal:visible').length;
    $(this).css('z-index', zIndex);
  });

  /*
   * Add a flag to the closing modal to avoid race conditions with resource registration
   */
  $(document).on('hide.bs.modal', '.ajax-modal', function () {
    $(this).addClass('closing');
  });

  /*
   * Destroy AJAX modal completly when they are removed.
   */
  $(document).on('hidden.bs.modal', '.ajax-modal', function () {
    prewikka_resource_destroy($(this));
    $(this).data('bs.modal', null);
    $(this).remove();
  });

  $(window).on("resize", function(e) {
    if ( e.target == window ) // avoid infinite event loop
        $("#main").trigger("resize");
  });
});

function prewikka_resizeTopMenu() {
    var mainmenu = $('#main_menu_ng .main_menu_navbar');

    if ( mainmenu.length == 0 ) return;

    var topmenu = $("#topmenu .topmenu_nav");
    var topright = $("#topmenu_right");
    var main = $("#main");
    var window_width = $(window).width();

    mainmenu.removeClass('collapsed'); // set standard view
    main.css("margin-top", "");
    mainmenu.css("margin-top", "");
    topmenu.css("height", "").css("width", "");

    if ( window_width > 768 ) {
        topmenu.css("width", window_width - mainmenu.innerWidth() - topright.innerWidth());

        if ( Math.max(mainmenu.innerHeight(), topmenu.innerHeight()) > 60 ) { // check if the topmenu or mainmenu is split across two lines
            mainmenu.addClass('collapsed');

            topmenu.css("width", window_width - mainmenu.innerWidth() - topright.innerWidth());

            var height = Math.max(mainmenu.innerHeight(), topmenu.innerHeight());

            if ( height > 60 ) { // check if we've still got 2 lines or more
                main.css("margin-top", height - 40);
                topmenu.css("height", height);
            }
        }
    }
    else {
        mainmenu.css("margin-top", topmenu.innerHeight());
        main.css("margin-top", Math.max(topmenu.innerHeight(), $("#main_menu_ng").innerHeight()));
    }
}


function prewikka_notification(data)
{
    var notification = $("#prewikka-notification");

    $(notification).find(".title").text(data.name || "");
    $(notification).find(".content").text(data.message);

    if ( typeof(data.classname) === 'undefined' )
        data.classname = "success";

    $(notification).find(".alert").removeClass().addClass("alert alert-" + data.classname);
    $(notification).find(".fa").removeClass().addClass("fa fa-" + data.icon);
    $(notification).stop().fadeIn(0).show().delay(data.duration || 2000).fadeOut(1000);
}


function _dialog_common(dialog, opts)
{
    if ( typeof(opts) == 'undefined' || opts.show )
        $(dialog).modal();

    if ( $(dialog).attr("data-draggable") )
        $(dialog).draggable({ handle: ".modal-header" });

    _initialize_components(dialog);
}


function prewikka_json_dialog(data, opts)
{
    var dialog;

    if ( typeof(opts) == 'undefined' )
        opts = { class: "ajax-modal", show: true }

    $("#prewikka-dialog-container").append(data.content);
    dialog = $("#prewikka-dialog-container > :last-child");

    $(dialog).addClass("modal fade");
    if ( opts.class )
        $(dialog).addClass(opts.class);

    _dialog_common(dialog, opts);
    return dialog;
}


function prewikka_dialog(data)
{
    if ( typeof(data.type) == 'undefined' )
        data.type = "standard";

    var dialog = $("#prewikka-dialog-" + data.type);
    var header = $(dialog).find(".modal-header");

    $(header).removeClass().addClass("modal-header");
    if ( data.classname )
            $(header).addClass("alert-" + data.classname);

    $(dialog).find(".content").text(data.message);
    _dialog_common(dialog);
}


function prewikka_dialog_getMaxHeight() {
    return $(window).height() - $("#topmenu").height() - 100;
}


function prewikka_getRenderSize(container, options)
{
        var parent;
        var size = [0, 0];
        var overflow_backup = document.body.style.overflow;

        /*
         * take into account potential scrollbar size.
         */
        document.body.style.overflow = "scroll";

        /*
         * Get the first parent block level element, so that we gather
         * the full usable width.
         */
        parent = $(container).parents().filter(function() {
            return $(this).css("display") == "block";
        }).first();

        size[0] = options.width;
        if ( ! size[0] )
            size[0] = $(parent).width();

        if ( typeof(options.width) == "string" && options.width.indexOf("%") != -1 ) {
            if ( ! options.spacing )
                options.spacing = 0;

            size[0] = ($(parent).width() - options.spacing) / 100 * parseInt(options.width) - options.spacing;
        }

        if ( typeof(options.height) == "string" && options.height.indexOf("%") != -1 )
            size[1] = ($(parent).width() - options.spacing) / 100 * parseInt(options.height) - options.spacing;
        else {
            size[1] = options.height;
            if ( ! size[1] )
                size[1] = $("#_main_viewport").height();
        }

        document.body.style.overflow = overflow_backup;

        return size;
}


var PREWIKKA_GRID_AJAX_PARAMETERS = ["sort_index", "sort_order", "page", "rows"];


function prewikka_grid(table, settings) {
    var conf = _mergedict({
        datatype: "local",
        cmTemplate: {title: false},
        autoencode: true,
        autowidth: true,
        forceFit: true,
        shrinkToFit: true,
        guiStyle: "bootstrap",
        iconSet: "fontAwesome",
        prmNames: {sort: "sort_index", order: "sort_order", search: null, nd: null}
    }, settings);

    return $(table).jqGrid(conf);
}


function prewikka_autocomplete(field, url, submit, allow_empty=false) {
    field.autocomplete({
        appendTo: $(field).closest("#main, .modal"),
        minLength: 0,
        autoFocus: true,
        source: function(request, response) {
            $.ajax({
                url: url,
                data: {query: request.term},
                dataType: "json",
                global: false, // No prewikka dialog in case of error
                success: function(data) {
                    var rows = $.map(data.rows, function(row) {
                        var name = row.cell.name;
                        return name.toHTML ? $(name.toHTML()).text() : name;
                    });
                    response(rows);
                    field.parent("div").toggleClass("has-error", !rows.length);
                    field.next().toggleClass("fa-close", !rows.length);
                    if ( submit ) submit.prop("disabled", $(".has-error").length);
                },
                error: function(xhr, status, error) {
                    field.parent("div").addClass("has-error");
                    field.next().addClass("fa-close");
                    if ( submit ) submit.prop("disabled", true);
                    var message = xhr.responseText ? JSON.parse(xhr.responseText).details : error || "Connection error";
                    field.prop("title", message);
                    response([]);
                }
            });
        },
        select: function() {
            if ( submit ) submit.prop("disabled", $(".has-error").length);
        }
    })
    .focus(function() {
        $(this).autocomplete("search");
    })
    .blur(function() {
        if ( allow_empty && $(this).val() == "" ) {
            field.parent("div").removeClass("has-error");
            field.next().removeClass("fa-close");
            if ( submit ) submit.prop("disabled", $(".has-error").length);
        }
    });
}


function HTMLNode(obj) {
    var ret = {};
    var inner = "";

    $.each(obj.childs, function(i, child) {
        inner += (child && child.toHTML) ? child.toHTML() : _.escape(child);
    });

    var element;

    if ( obj.tag )
        element = $("<div>").append($("<" + obj.tag + ">", obj.attrs).html(inner));
    else
        element = $("<div>").html(inner);

    ret.toHTML = function() {
        return element.html();
    };

    ret.toString = function() {
        /* Used for client-side grid searches */
        return element.text();
    };

    return ret;
}

window.json_registry.register("HTMLNode", HTMLNode);


function Criterion(left, operator, right) {
    var ret = {
        left: left,
        operator: operator,
        right: right
    };

    ret.toJSON = function() {
        if ( left && typeof(left) == "object" )
            left = left.toJSON();

        if ( right && typeof(right) == "object" )
            right = right.toJSON();

        return {
            "__prewikka_class__": ["Criterion", {"left": left, "operator": operator, "right": right}]
        };
    };

    return ret;
}

window.json_registry.register("Criterion", function(obj) {
    return Criterion(obj.left, obj.operator, obj.right);
});


function DatetimePicker(input, date, options, delta)
{
    var that = {};
    var hidden_input = $('<input/>').attr({ type: 'hidden',
                                            name: input.data('name'),
                                            class: 'form-control input-sm hidden_' + input.data('name'),
                                            value: date });

    if ( ! delta )
        delta = 0;

    hidden_input.appendTo(input.parent());

    that.get_value = function() {
        return input.datetimepicker("getDate");
    };

    function _timestamp(dt) {
        return (dt.getTime() - (dt.getTimezoneOffset() * 60000)) / 1000;
    }

    function _update_input(dt) {
        hidden_input.val((dt) ? _timestamp(dt) : _timestamp(that.get_value()) + delta);
    }

    input.datetimepicker(_mergedict(options, {
            "onSelect": function() {
                            _update_input();
                            if ( "onSelect" in options )
                                options["onSelect"]();
                        },
            "onClose": function() {
                            _update_input();
                            if ( "onClose" in options )
                                options["onClose"]();
                        }
        })
    );

    var dt = new Date(moment(date));

    input.datetimepicker("setDate", dt);
    _update_input(dt);

    return that;
}



function _resource_register(obj, target)
{
    var mlist;

    mlist = target.data("prewikka-resources");
    if ( ! mlist ) {
        mlist = [];
        target.data("prewikka-resources", mlist);
    }

    mlist.push(obj);
}



function prewikka_resource_register(obj)
{
    var target;
    var base = obj.container;

    if ( ! base )
        base = $('.prewikka-resources-container:not(.closing) script').last();

    target = $(base).closest(".prewikka-resources-container:not(.closing)");
    if ( target.length > 0 )
        _resource_register(obj, target);

    if ( ! $(target).is($("#main")) )
        _resource_register(obj, $("#main"));
}



function prewikka_resource_destroy(target)
{
    var mlist = target.data("prewikka-resources");

    /*
     * removeData() only remove data from the JQuery cache. The data
     * are still present and can still be fetched.
     */
    target.data("prewikka-resources", "");
    if ( ! mlist )
        return;

    /*
     * LIFO order
     */
    for ( var i = mlist.length; i--; ) {
        if ( ! mlist[i].destroy )
            continue;

        try {
            mlist[i].destroy();
        } finally {
            mlist[i].destroy = null; /* in case the module is registered in multiple places */
        }
    }
}
