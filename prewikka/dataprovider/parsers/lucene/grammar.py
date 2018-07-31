# Copyright (C) 2018 CS-SI. All Rights Reserved.
# Author: Yoann Vandoorselaere <yoannv@gmail.com>
#
# This file is part of the Prewikka program.
#
# This program is free software; you can redistribute it and/or modify
# it under the terms of the GNU General Public License as published by
# the Free Software Foundation; either version 2, or (at your option)
# any later version.
#
# This program is distributed in the hope that it will be useful,
# but WITHOUT ANY WARRANTY; without even the implied warranty of
# MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
# GNU General Public License for more details.
#
# You should have received a copy of the GNU General Public License along
# with this program; if not, write to the Free Software Foundation, Inc.,
# 51 Franklin Street, Fifth Floor, Boston, MA 02110-1301 USA.

from __future__ import absolute_import, division, print_function, unicode_literals


GRAMMAR = r"""
    ?criteria: criterion
             | criteria (_WS|BOOL_AND|BOOL_OR) criterion -> bool_

    criterion: operator (inclusive_range | exclusive_range | value_string)
             | LPAR criteria RPAR -> parenthesis

    inclusive_range: field _WS* "[" _string _WS "TO" _WS _string "]"
    exclusive_range: field _WS* "{" _string _WS "TO" _WS _string "}"
    value_string: field _string (string_modifier)?

    operator: OPERATOR?
    OPERATOR.1: "NOT" _WS+ | "!" | "-" | "+"

    _string: (dqstring | sqstring | regstr | uqstring)
    string_modifier: BOOST_MODIFIER | FUZZY_MODIFIER

    BOOST_MODIFIER: "^" /[0-9]+/
    FUZZY_MODIFIER: "~" /[0-9]*/

    SQSTRING.1: "'" ("\\'" | /[^']/)* "'"
    DQSTRING.1: "\"" ("\\\""|/[^"]/)* "\""
    RESTRING.1: "/" ("\\/"|/[^\/]/)* "/"
    !sqstring: SQSTRING
    !dqstring: DQSTRING
    !regstr: RESTRING
    !uqstring: UNQUOTED_STRING

    SPECIAL_CHARACTERS: "+" | "-" | "!" | "(" | ")" | "{" | "}" | "[" | "]" | "^" | "\"" | "~" | "*" | "?" | ":" | "\\" | "&" | "|"
    ESCAPED_SPECIAL_CHARACTERS: "\\" SPECIAL_CHARACTERS
    UNQUOTED_STRING.0: (ESCAPED_SPECIAL_CHARACTERS | /[^+\-!(){}\[\]^\"\~:\s\+]/)+

    field: (FIELD)? -> field
    FIELD: PATH ":"
    PATH: (PATHELEM ".")* PATHELEM
    PATHELEM: WORD ("(" PATHINDEX ")")?
    PATHINDEX: "-"? (DIGIT+ | UNQUOTED_STRING)
    WORD: LETTER (LETTER | DIGIT | "-" | "_")+
    DIGIT: /[0-9]/
    LETTER: /[a-z]/
    BOOL_AND: _WS* ("&&" | "AND") _WS*
    BOOL_OR: _WS* ("||" | "OR") _WS*

    LPAR: _WS* "(" _WS*
    RPAR: _WS* ")" _WS*

    _WS: /[ \t\f\r\n]/+
"""
