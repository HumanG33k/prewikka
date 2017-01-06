<script type="text/javascript">
$LAB.script("prewikka/js/mainmenu.js", "prewikka/js/moment.min.js").wait(function() {
    window.mainmenu.reset();

    % if auto_apply_enable == "true":
    window.mainmenu.start();
    % endif

    MainMenuInit("${timeline.time_format}");

    $('#timeline_end').datetimepicker("setDate", new Date(moment("${timeline.end}")));
    $('#timeline_start').datetimepicker("setDate", new Date(moment("${timeline.start}")));
    update_date_input();

    % if timeline.quick_custom:
    trigger_custom_date(true);
    % else:
    trigger_custom_date(false);
    % endif

    $('#main_menu_ng').trigger('mainmenu_ready');
});
</script>

<div id="main_menu_ng">
     <input type="hidden" name="timeline_end" id="hidden_timeline_end" value="${timeline.end}">
     <input type="hidden" name="timeline_start" id="hidden_timeline_start" value="${timeline.start}">
     <input type="hidden" name="timeline_value" id="hidden_timeline_value" value="${timeline.value}">
     <input type="hidden" name="timeline_unit" id="hidden_timeline_unit" value="${timeline.unit}">
     <input type="hidden" name="timeline_absolute" id="hidden_timeline_absolute" value="${timeline.absolute}">
     <input type="hidden" name="auto_apply_enable" id="hidden_auto_apply_enable" value="${auto_apply_enable}">
     <input type="hidden" name="auto_apply_value" id="hidden_auto_apply_value" value="${auto_apply_value}">
     <input type="hidden" name="_save" value="1">

     <div class="form-inline pull-right" id="main_menu_navbar">
          % for i in menu_extra:
          <div class="form-group main_menu_extra">
               ${i}
          </div>
          % endfor

          <div class="form-group">
               <div class="btn-group" id="dropdown-refresh">
                    <label class="label-xs">${ _("Refresh:") }</label><br>
                    <div data-toggle="tooltip" title="${ _("Update frequency of the current page") }" data-trigger="hover" data-container="#main">
                    <button type="button" class="btn btn-default btn-sm dropdown-toggle" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false" data-target="#dropdown-refresh">
                         <span class="reload-icon">&#8634;</span><span id="refresh-value">${timeline.refresh_selected}</span><span class="caret"></span>
                    </button>
                    </div>

                    <ul class="dropdown-menu" id="refresh-select">
                    % for label, value in timeline.refresh:
                         <li><a data-value="${value}">${label}</a></li>
                    % endfor
                         <li role="separator" class="divider"></li>
                         <li><a data-value="0">${ _("Inactive") }</a></li>
                    </ul>
               </div>
          </div>

          <div class="form-group">
               <div class="btn-group" id="dropdown-period">
                    <label class="label-xs">${ _("Period:") }</label><br>
                    <div data-toggle="tooltip" title="${ _("Period to visualize") }" data-trigger="hover" data-container="#main">
                    <button type="button" class="btn btn-default btn-sm dropdown-toggle" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false" data-target="#dropdown-period">
                         <span id="timeline_quick_selected">${timeline.quick_selected}</span> <span class="caret">
                    </button>
                    </div>

                    <ul class="dropdown-menu" id="timeline_quick_select">
                         <li><a data-value="" data-unit="" data-absolute="" id="timeline_quick_select_custom">${ _("Custom") }</a></li>
                         <li role="separator" class="divider"></li>
                    % for label, value, unit, absolute in timeline.quick:
                         <li><a data-value="${value}" data-unit="${unit}" data-absolute="${absolute}">${label}</a></li>
                    % endfor
                    </ul>
               </div>
          </div>

          <div class="form-group form-group-date">
               <label for="timeline_start" class="label-xs">${ _("Start:") }</label>
               <input class="form-control input-sm input-timeline-datetime" type="text" id="timeline_start" name="" placeholder="${ _("start") }" value="" data-toggle="tooltip" title="${ _("Date of the oldest alert to visualize") }" data-trigger="hover" data-container="#main">
          </div>

          <div class="form-group form-group-date">
               <label for="timeline_end" class="label-xs">${ _("End:") }</label>
               <input class="form-control input-sm input-timeline-datetime" type="text" id="timeline_end" placeholder="${ _("end") }" value="" data-toggle="tooltip" title="${ _("Date of the newest alert to visualize") }" data-trigger="hover" data-container="#main">
          </div>

          <button class="btn btn-primary btn-sm btn-submit disabled" id="main_menu_form_submit" type="submit">${ _("Go!") }</button>
     </div>
</div>

