// Erzeuge einen privaten Scope durch eine anonyme Funktion,
// speichere den Rückgabwert in einer globalen Variable
var SelectionMenu = (function () {
	
	var id = 'selection-menu';
	var span = null;
	
	// Geteilte private Helferfunktionen
	
	function addEvent (obj, type, fn) {
		// Fähigkeitenweiche DOM Events / Microsoft
		if (obj.addEventListener) {
			obj.addEventListener(type, fn, false);
		} else if (obj.attachEvent) {
			obj.attachEvent('on' + type, function () {
				return fn.call(obj, window.event);
			});
		}
	}
	
	// Mache addEvent als statische Methode öffentlich
	// (hefte die Methode an den Konstruktor, der zurückgegeben wird)
	SelectionMenu.addEvent = addEvent;
	
	function getSelection () {
		// Fähigkeitenweiche HTML5 / Microsoft
		if (window.getSelection) {
			return window.getSelection();
		} else if (document.selection && document.selection.createRange) {
			return document.selection.createRange();
		} else {
			// Keine Browser-Unterstützung für die benötigten Features
			return false;
		}
	}
	
	function getSelectedText (selection) {
		// Fähigkeitenweiche HTML5 / Microsoft
		return selection.toString ? selection.toString() : selection.text;
	}
	
	function contains (a, b) {
		// Fähigkeitenweiche DOM Core / Microsoft
		return a.compareDocumentPosition ? !!(a.compareDocumentPosition(b) & 16) : a.contains(b);
	}
	
	function succeedingNode (a, b) {
		// Fähigkeitenweiche DOM Core / Microsoft
		if (a.compareDocumentPosition) {
			return a.compareDocumentPosition(b) & 2 ? a : b;
		} else {
			var elementA = a.nodeType == 3 ? a.parentNode : a;
			var elementB = b.nodeType == 3 ? b.parentNode : b;
			if (typeof elementA.sourceIndex == 'number' && typeof elementB.sourceIndex == 'number') {
				return elementA.sourceIndex > elementB.sourceIndex ? a : b;
			} else {
				// Keine Browser-Unterstützung für die benötigten Features
				return false;
			}
		}
	}
	
	function mouseOnMenu (e) {
		// Greife auf das Zielelement des Ereignisses zu
		// Fähigkeitenweiche DOM Events / Microsoft
		var target = e.target || e.srcElement;
		// Ist das Zielelement das Menü oder darin enthalten?
		return target == span || contains(span, target);
	}
	
	// Konstruktorfunktion
	function SelectionMenu (options) {
		var instance = this;
		
		// Kopiere Einstellungen aus dem options-Objekt herüber zur Instanz
		instance.menuHTML = options.menuHTML;
		instance.minimalSelection = options.minimalSelection || 5;
		instance.container = options.container;
		instance.handler = options.handler;
		
		// Initialisiere
		instance.create();
		instance.setupEvents();
	}
	
	SelectionMenu.prototype = {
		
		create : function () {
			var instance = this;
			
			// Erzeuge den Menü-Container, wenn noch nicht passiert
			if (span) {
				return;
			}
			
			span = document.createElement('span');
			span.id = id;
		},
		
		setupEvents : function () {
			
			var instance = this;
			var container = instance.container;
			
			// Verstecke beim Mousedown
			addEvent(container, 'mousedown', function (e) {
				instance.hide(e);
			});
			
			// Füge ein beim Mouseup (wenn Text ausgewählt wurde)
			addEvent(container, 'mouseup', function (e) {
				instance.insert(e);
				
				// Prüfe nach einer Verzögerung, ob in die vorhandene Auswahl
				// angeklickt wurde und die Auswahl damit aufgehoben wurde
				window.setTimeout(function () {
					instance.hideIfNoSelection();
				}, 1);
				
			});
			
			instance.setupMenuEvents();
		},
		
		setupMenuEvents : function () {
			var instance = this;
			
			// Registiere Handlerfunktion für den Klick auf das Menü
			addEvent(span, 'click', function (e) {
				instance.handler.call(instance, e);
				return false;
			});
			
			// Verhindere das Markieren des Menüs im IE
			span.unselectable = true;
			/*
			addEvent(span, 'selectstart',  function () { 
				return false;
			});
			*/
		},
		
		hide : function (e) {
			// Breche ab, wenn Event-Objekt übergeben wurde und der Klick beim Menü passierte
			if (e && mouseOnMenu(e)) {
				return;
			}
			// Ist das Element in den DOM-Baum gehängt?
			var parent = span.parentNode;
			if (parent) {
				// Entferne es aus dem DOM-Baum (Element bleibt im Speicher erhalten
				// und wird später wiederverwendet)
				parent.removeChild(span);
			}
		},
		
		hideIfNoSelection : function () {
			var instance = this;
			var selection = getSelection();
			if (!selection) {
				return;
			}
			var selectedText = getSelectedText(selection);
			if (!selectedText.length) {
				instance.hide();
			}
		},
		
		insert : function (e) {
			var instance = this;
			
			// Breche ab, wenn das Mausereignis beim Menü passierte
			if (mouseOnMenu(e)) {
				return;
			}
			
			// Hole Selection bzw. TextRange (IE)
			var selection = getSelection();
			if (!selection) {
				// Keine Browser-Unterstützung für die benötigten Features
				return;
			}
			
			// Hole markierten Text
			var selectedText = getSelectedText(selection);
			instance.selectedText = selectedText;
			
			// Breche ab, wenn der markierte Text zu kurz ist
			if (selectedText.length < instance.minimalSelection) {
				instance.hide(e);
				return;
			}
			
			// Fähigkeitenweiche DOM Range / Microsoft
			if (selection.getRangeAt) {
				
				// Hole Range, die zur Selection gehört
				var range = selection.getRangeAt(0);
				
				// Erzeuge neue (leere) Range
				var newRange = document.createRange();
				
				// Verschiebe Anfang der neuen Range an das Ende der Auswahl
				var endNode = succeedingNode(selection.anchorNode, selection.focusNode);
				if (!endNode) {
					return;
				}
				var endOffset = range.endOffset;
				
				// Falls der Endknoten ein Element ist, nehme das Ende des letzten Textknoten
				if (endNode.nodeType == 1) {
					var endNode = endNode.lastChild;
					if (!endNode || endNode.nodeType != 3) {
						return;
					}
					endOffset = endNode.data.length;
				}
				
				newRange.setStart(endNode, endOffset);
				
				// Befülle Menü-Span
				span.innerHTML = instance.menuHTML;
				newRange.insertNode(span);
				
				// Korrigiere Auswahl, verhindere das Markieren des Menüs (umschifft IE-Bugs)
				selection.removeAllRanges();
				selection.addRange(range);
				
			} else if (selection.duplicate) {
				
				// Kopiere TextRange
				var newRange = selection.duplicate();
				
				// Verschiebe Anfang der neuen Range an das Ende der Auswahl
				newRange.setEndPoint('StartToEnd', selection);
				
				// Befülle Menü-Span
				span.innerHTML = instance.menuHTML;
				newRange.pasteHTML(span.outerHTML);
				
				// Korrigiere Auswahl und setze sie auf die ursprüngliche Auswahl zurück,
				// sodass das Menü nicht selektiert ist (passiert in manchen Fällen)
				selection.select();
				
				// Da das Befüllen nicht über das DOM, sondern über serialisierten HTML-Code erfolgt,
				// stellen wir die Referenz wieder her sowie den Event-Handler
				span = document.getElementById(id);
				instance.setupMenuEvents();
				
			} else {
				// Keine Browser-Unterstützung für die benötigten Features
				return;
			}
			
			// Positioniere Menü
			instance.position();
		},
		
		position : function () {
			span.style.marginTop = -(span.offsetHeight + 5) + 'px';
		}
	};
	
	// Gebe Konstruktor zurück
	return SelectionMenu;
})();