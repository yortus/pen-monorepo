Start
    = e:Expression   WS   { return e; }


Expression
    = RecordExpression
    / StringExpression


RecordExpression
    = "{"   h:Property   t:(WS   ","   WS   Property)*   "}"
    { return {type: 'RecordExpression', members: [h].concat(t.map(t => t[3]))}; }


Property
   = key:Identifier   WS   ":"   WS   value:Expression   { return {type: 'Property', key, value}; }


Identifier
    = [_a-z]i   [_a-z0-9]i*   { return text(); }


StringExpression
    = StringSelectionExpression


StringSelectionExpression
    = h:StringSequenceExpression   t:(WS   "|"   WS   StringSequenceExpression)+
        { return {type: 'StringSelectionExpression', values: [h].concat(t.map(t => t[3]))}; }
    / StringSequenceExpression


StringSequenceExpression
    = h:StringRepeatExpression   t:(WS   StringRepeatExpression)+
        { return {type: 'StringSequenceExpression', values: [h].concat(t.map(t => t[1]))}; }
    / StringRepeatExpression


StringRepeatExpression
    = e:StringPrimaryExpression   WS   "?"   { return {type: 'StringRepeatExpression', value: e, max: 1}; }
    / e:StringPrimaryExpression   WS   "*"   { return {type: 'StringRepeatExpression', value: e, min: 0}; }
    / e:StringPrimaryExpression   WS   "+"   { return {type: 'StringRepeatExpression', value: e, min: 1}; }
    / StringPrimaryExpression


StringPrimaryExpression
    = StringLiteral
    / CharacterWildcard
    // TODO: CharacterClass


StringLiteral
    = '"' text:[^"]* '"'   { return {type: 'StringLiteral', value: text.join('')}; }


CharacterWildcard
    = "."   { return {type: 'CharacterWildcard'}; }


WS = [ \t\r\n]*
