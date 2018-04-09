"use strict";

function set_postdata()
{
    var pdata = $("#datasearch_table").getGridParam("postData") || {};

    $.each($("#form_search :input").serializeArray(), function(i, input) {
        pdata[input.name] = input.value;
    });

    return pdata;
}

function DataSearchPage(backend, criterion_config, criterion_config_default, timeline_url)
{
    var escapeRegex = $.ui.autocomplete.escapeRegex;

    /* Check if a word needs quotes */
    function lucene_need_quotes(value)
    {
        /*
         * We add "/"" to the lucene escape characters as ELK interpret them as a regexp
         */
        return /[/\s+\-!(){}[\]^"~*?\:\\]|&&|\|\|/g.test(value);
    }

    function idmef_need_quotes(value)
    {
        return /\s/g.test(value);
    }

    function need_quotes(value)
    {
        var ret;

        if ( criterion_config_default == "criterion" )
            ret = idmef_need_quotes(value);
        else
            ret = lucene_need_quotes(value);

        return ret;
    }

    function quote(value)
    {
        if ( need_quotes(value) )
            return '"' + value.replace(/"/g, '\\"') + '"';

        return value;
    }

    function _criterion(path, operator, value)
    {
        if ( value == undefined )
            value = "";

        operator = criterion_config[criterion_config_default].operators[operator];

        return eval(criterion_config[criterion_config_default].format);
    }

    function lucene_criterion(path, operator, value)
    {
        return _criterion(path, operator, (operator == "substr") ? value + "*" : value);
    }

    function idmef_criterion(path, operator, value)
    {
        return _criterion(path, operator, value);
    }

    function criterion(path, operator, value)
    {
        var ret;

        if ( criterion_config_default == "criterion" )
            ret = idmef_criterion(path, operator, value);
        else
            ret = lucene_criterion(path, operator, value);

        return ret;
    }

    function lucene_criterion_regex(path, operator, value)
    {
        var ret;
        var opstr = criterion_config[criterion_config_default].operators[operator];

        if ( value == undefined )
            value = "";

        ret = escapeRegex(opstr + path + ":" + value);

        if ( operator == "equal" || operator == "substr" )
            ret = "[^-]" + ret;

        return ret;
    }

    function idmef_criterion_regex(path, operator, value)
    {
        if ( value == undefined )
            value = "";

        if ( operator )
            operator = criterion_config[criterion_config_default].operators[operator];
        else
            operator = "\\s*[=<>]+\\s*";

        return escapeRegex(path) + operator + escapeRegex(value);
    }

    function criterion_regex(path, operator, value)
    {
        var ret;

        if ( criterion_config_default == "criterion" )
            ret = idmef_criterion_regex(path, operator, value);
        else
            ret = lucene_criterion_regex(path, operator, value);

        return ret.replace(/\s+/g, "\s*");
    }

    /* Remove value, or field from the search bar */
    function sub_from_search(field, operator, value, positive, search)
    {
        var regex, ffield, opregex;

        ffield = criterion_regex(field, operator, value);
        search = search === undefined? $("#input_search").val() : search;

        opregex = criterion_config[criterion_config_default].operators["AND"].concat(criterion_config[criterion_config_default].operators["OR"]);
        opregex = opregex.map(escapeRegex).join("|");
        opregex = "(" + opregex + "|\\s+|^)\\s*";

        regex = opregex + ffield;
        regex += ((value) ? /(\s+|$)/ : /(".+?"|\S+)/).source;

        search = search.replace(RegExp(regex, "ig"), "");

        /*
         * Remove any empty parenthesis, or leftover && / ||
         */
        search = search.replace(RegExp(/(^\s*&&\s*)|(\s*&&\s*$)|(\(\s*\))/, "ig"), "");
        return $.trim(search);
    }

    function _add_to_input(field, operator, value, positive)
    {
        value = String(value);

        var search;

        if ( positive ) {
            search = sub_from_search(field, operator, null, false);
            search = sub_from_search(field, "notequal", value, positive, search);
        } else {
            search = sub_from_search(field, operator, value, false);
        }

        if ( search ) {
            search += " " + criterion_config[criterion_config_default].operators["AND"][0] + " ";
            search = search.replace(/(\s\s+)$/g, " ");
        }

        $("#input_search").val(search + criterion(field, operator, quote(value)));
    }

    function render_timeline(force) {
        var shown = $("#timeline").hasClass("collapse in");

        if ( ! shown )
            return;

        if ( $("#timeline_results").children().length > 0 && !force )
            return;

        prewikka_resource_destroy($('#timeline_results'))

        $.ajax({
            url: timeline_url,
            data: $("#form_search").serializeArray()
        }).done(function(data, textStatus, xhr) {
            $("#timeline_results").html(data);
        });
    }

    /* Reset the search bar */
    function reset_search() {
        $("#input_search").val("");
    }

    function update_datasearch()
    {
        set_postdata();

        $("#datasearch_table").trigger("reloadGrid");
        render_timeline(true);
    }


    /* Event on popover link */
    $("#main").on("click", "#PopoverOption .new_search, #PopoverOption .add_search, .subgrid i.add_search", function() {
        if ( $(this).hasClass("new_search") )
            reset_search();

        _add_to_input($(this).data("field"), $(this).data("operator") || "equal", $(this).data("value"), true);
        update_datasearch();
    });

    $("#main").on("click", "#PopoverOption .del_search, .subgrid i.del_search", function() {
        var search = sub_from_search($(this).data("field"), null, quote($(this).data("value")), false);
        $("#input_search").val(search);

        _add_to_input($(this).data("field"), "not" + $(this).data("operator"), $(this).data("value"), false);
        update_datasearch();
    });

    $("#view-config-editable").change(function() {
        $("#datasearch_table").jqGrid($(this).prop("checked") ? 'showCol' : 'hideCol', 'cb');
        $("#main .footer-buttons").collapse($(this).prop("checked") ? 'show' : 'hide');
        $("#datasearch_table").find("td.sgexpanded").click();
        $("#form_search :input[name=editable]").val($(this).prop("checked") ? 1 : 0);
    }).change();

    $("#view-config-condensed").change(function() {
        $("#datasearch_table").toggleClass("table-nowrap", $(this).prop("checked"));
        $("#form_search :input[name=condensed]").val($(this).prop("checked") ? 1 : 0);
    }).change();

    $("#datasearch_table").parents(".row").change("change", function () {
        $("#main .footer-buttons .btn.needone").prop("disabled", $("#datasearch_table input.cbox:checked").length == 0);
    }).change();

    $("#prewikka-view-config-datasearch :input").on("change", function() {
        prewikka_update_parameters($("#form_search :input:not(.mainmenu)").serializeArray());
    });

    $("#form_search").on("submit", function(event) {
        if ( $("select[name='groupby[]'] :selected").length > 0 )
            return;

        event.preventDefault();
        update_datasearch();

        /*
         * Since we override the default form submit behavior,
         * we need to manually update the parameters so that the mainmenu is saved.
         */
        prewikka_save_parameters($("#form_search").serializeArray());
    });

    $("#timeline").on('show.bs.collapse', function() {
        $("#_main").css("overflow", "hidden");
    });

    $("#timeline").on('shown.bs.collapse hidden.bs.collapse', function() {
        var shown = $("#timeline").hasClass("collapse in");

        $("#timeline input").attr("value", (shown) ? "1" : "0");
        prewikka_update_parameters($("#form_search :input:not(.mainmenu)").serializeArray());

        render_timeline();
        resizeGrid();

        $("#_main").css("overflow", "auto");
    });

    $("#main .footer-buttons").on({'shown.bs.collapse': resizeGrid, 'hidden.bs.collapse': resizeGrid});

    $("#main").on("reload", function() {
        update_datasearch();
        return false;
    });

    /* Popover on click on element with hover class */
    $("#main").on("click", ".hover, .hover-details", function() {
        var offset = $(this).offset();
        var rowid = $(this).closest("tr").attr("id");
        var td = $(this).closest("td").first();
        var span = $(td).children();
        var selected_field = $(this).closest("[data-field]");
        var selected_operator = ($(this).is(selected_field)) ? "equal" : "substr";
        var selected_value = $(this).closest("[data-value]").data("value") || $(this).text();

        selected_field = selected_field.data("field");
        $(this).addClass("selected");

        $("#PopoverOption a:not(.addon_search)")
            .data("field", selected_field)
            .data("operator", selected_operator)
            .data("value", selected_value).show();

        $("#PopoverOption .addon_search").each(function() {
            var d = $(this).data();
            if ( ! d.parameter )
                d.parameter = "value";

            var href = $(this).attr("href");
            var value = selected_value;
            if ( d.field )
                value = $('#datasearch_table').jqGrid('getCell', rowid, d.field);

            // The {[key]: value} syntax is not supported by IE11
            var params = {};
            params[d.parameter] = value;
            $(this).attr("href", href + (href.indexOf('?') >= 0 ? '&' : '?') + $.param(params));
            if ( d.path )
                $(this).toggle(d.path === backend + "." + selected_field.replace(/\(\d+\)/g, ""));
        });

        $("#PopoverOption a.groupby_search").attr("href", prewikka_location().href + "?groupby[]=" + selected_field);
        $("#PopoverOption .groupby_search span").text(selected_field);
        if ( $(this).hasClass("gbonly") )
            $("#PopoverOption a:not(.groupby_search)").hide();

        $("#PopoverOption").show();

        var top = offset.top - $(window).scrollTop() + $(this).height();
        var left = offset.left - $(window).scrollLeft() - $("#PopoverOption .popover").width() / 2 + $(this).width() / 2;

        if ( top + $("#PopoverOption .popover").height() > window.innerHeight ) {
            top = offset.top - $(window).scrollTop() - $("#PopoverOption .popover").height();
            $("#PopoverOption .popover").removeClass("bottom").addClass("top");
        }
        else {
            $("#PopoverOption .popover").removeClass("top").addClass("bottom");
        }

        $("#PopoverOption")
            .css({"top": top, "left": left})
            .on("click", "a", function() {
                $("#PopoverOption").hide();
            });

        $("#datasearch_table").jqGrid("setSelection", $(this).closest("tr").attr("id"));

        return false;
    });

    $("#main").on("click scroll", function() {
        $("#PopoverOption").hide();
    });

    var window_width = $(window).width();
    $("#main").on("resize", function() {
        if ( $(window).width() != window_width ) {
            window_width = $(window).width();

            var chart = $("[class^=renderer-elem]");
            chart.find("div").first().css("width", "100%");
            chart.trigger("resize");
        }
    });

    $('#datasearch_table').on('mouseover mouseout', ".l", function(e) {
        $(this).toggleClass('hover', e.type == 'mouseover');
        e.stopPropagation();
    });

    $("#form_search .datasearch-mode").on("click", function() {
        criterion_config_default = (criterion_config_default == "lucene") ? "criterion" : "lucene";
        $(this).text(criterion_config_default.capitalize());
        $("#form_search input[name=query_mode]").val(criterion_config_default);
        prewikka_update_parameters($("#form_search").serializeArray());
        reset_search();
    });

    /* Refresh the search bar when click on refresh button */
    $("#form_search .datasearch-refresh").on("click", reset_search);

    $("#datasearch_grid_form").on("submit-prepare", function(event, form, data) {
        var idlist = [];
        var grid = $("#datasearch_table").getGridParam("userData");

        $.each($("#datasearch_table").getGridParam("selarrrow"), function(_, value) {
            data.push({name: "criteria[]", value: JSON.stringify(grid[value].cell._criteria)});
        });

        return data;
    });

    $("#datasearch_export_form").on("submit-prepare", function(event, form, data) {
        var grid = $("#datasearch_table").getRowData();
        var selected_rows = [];

        $.each($("#datasearch_table").getGridParam("selarrrow"), function(_, value) {
            selected_rows.push(grid[value]);
        });

        // Only get the text without the HTML tags
        data.push({"name": "datasearch_grid", "value": $("<div>").html(JSON.stringify(selected_rows)).text()});
    });

    if ( $("#main #timeline").hasClass("in") )
        render_timeline();
}


function datasearch_autocomplete_init(availabledata, history, labels) {
    var escapeRegex = $.ui.autocomplete.escapeRegex;
    var data = {fields: [], history: []};

    function split(val) {
        return val.split( /(\s+-?)/ );
    }
    /* Extract the last term to autocomplete */
    function extractLast(term) {
        return split(term).pop();
    }

    /* Delete specific query in history */
    function delete_query(item) {
        prewikka_ajax({
            url: $(item).data('url'),
            data: {query: $(item).data('query')},
            prewikka: {spinner: false}
        });
    }

    availabledata.forEach(function(item) {
        data.fields.push({'category': labels['Fields'], 'value': item});
    });

    if ( history.content !== null )
        history.content.forEach(function(item) {
            data.history.push({'category': labels['Query history'],
                               'value': item,
                               'url': history.url['delete']});
        });

        /* Redesign the select (without overwriting autocomplete) */
        $.widget("datasearch.myautocomplete", $.ui.autocomplete, {
            _create: function() {
                this._super();
                this.widget().menu( "option", "items", "> :not(.ui-autocomplete-category)" );
            },
            _renderMenu: function(ul, items) {
                var that = this,
                    currentcategory = "";

                $.each(items, function(index, item) {
                    if ( item.category != currentcategory ) {
                        ul.append($("<li>", {"class": "ui-autocomplete-category",
                                             "text": item.category}));
                        currentcategory = item.category;
                    }

                    that._renderItemData(ul, item);
                });
            },
            _renderItem: function(ul, item) {
                var li = $("<li>")
                    .attr("class", "datasearch-field")
                    .append(item.value);

                // The class ui-menu-item is mandatory
                // otherwise, the element is processed as a menu separator
                if ( item.url ) {
                    li = $("<i>", {"class": "fa fa-trash history-query-delete ui-menu-item",
                                   "data-url": item.url,
                                   "data-query": item.value})
                        .add(li);
                }

                li.appendTo(ul);

                return li;
            },
            _close: function (event) {
                if ( event != undefined && event.keepOpen === true ) {
                    this.search(null, event);
                    return true;
                }

                return this._super(event);
            }
        });

        $("#form_search").on("submit", function() {
            data.history.unshift({'category': labels['Query history'],
                                  'value': $("#input_search").val(),
                                  'url': history.url['delete']});
        });

        /* Autocomplete on search bar */
        $("#input_search").on("keydown", function(event) {
            if ( event.which === $.ui.keyCode.TAB && $(this).myautocomplete("instance").menu.active ) {
                event.preventDefault();
            }
        }).myautocomplete({
            appendTo: "#datasearch",
            minLength: 0,
            delay: 700,
            source: function(request, response) {
                var matcher = new RegExp("^-?" + escapeRegex(extractLast(request.term)), "i");
                var entries = {};
                $.each(data, function(key, value) {
                    entries[key] = $.grep(value, function(item) {
                        return matcher.test(item.value);
                    });
                });
                // Display only 5 history entries
                response(entries.fields.concat(entries.history.slice(0, 5)));
            },
            focus: function() {
                return false;
            },
            select: function( event, ui ) {
                var target = event.originalEvent.originalEvent.target;
                if ( target.localName == "i" ) {
                    // Delete the entry remotely
                    delete_query(target);

                    // Delete the entry locally
                    data.history = $.grep(data.history, function(e) {
                        return e.value != ui.item.value;
                    });

                    $.extend(event.originalEvent, {keepOpen: true});
                    return false;
                }

                this.value = ui.item.value;
                return false;
            }
        }).focus(function() {
            $(this).myautocomplete("search");
        });
}



function DataSearchListing(elem, columns, url, nbRow, jqgrid_params) {
    CommonListing(elem, {}, {
        datatype: "json",
        url: url,
        postData: set_postdata(),
        rowNum: nbRow,
        colNames: columns.names,
        colModel: columns.model,
        rowattr: function(row, data, id) {
            if ( data._classes )
                return { "class": data._classes };
        },
        subGrid: true,
        beforeProcessing: function(data) {
            data.userdata = data.rows;
            $("#datasearch input[name='datasearch_criteria']").val(JSON.stringify(data.criteria));
        },
        subGridRowExpanded: function(subgridDivId, rowId) {
            /* Delete the first empty td when the checkboxes are not present */
            if (! $("#view-config-editable").prop("checked")) {
                $("#" + $.jgrid.jqID(subgridDivId)).parent().siblings().first().remove();
            }

            $("#" + $.jgrid.jqID(subgridDivId)).html("<div class=\"loader\"></div>");

            var elem = {};
            var orig = $(this).jqGrid('getGridParam', 'userData')[rowId].cell;

            for ( var i in orig ) {
                elem[i] = (orig[i] && orig[i].toString) ? orig[i].toString() : orig[i];
            }

            if ( orig._criteria )
                elem["_criteria"] = JSON.stringify(orig._criteria);

            $.ajax({
                url: prewikka_location().pathname + "/ajax_details",
                data: elem,
                prewikka: {spinner: false},
                success: function(result) {
                    $("#" + $.jgrid.jqID(subgridDivId)).html(result);
                },
                error: function(result) {
                    $("#" + $.jgrid.jqID(subgridDivId)).html(result.responseJSON.content);
                }
            });
        }
    }, jqgrid_params);
}