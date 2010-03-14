var SelectionMenu = (function () {
	
	var id = 'selection-menu';
	var span = null;
	
	// Geteilte private Helferfunktionen
	
	function addEvent (obj, type, fn) {
		if (obj.addEventListener) {
			obj.addEventListener(type, fn, false);
		} else if (obj.attachEvent) {
			obj.attachEvent('on' + type, function () {
				return fn.call(obj, window.event);
			});
		}
	}
	
	// Mache addEvent als statische Methode öffentlich
	SelectionMenu.addEvent = addEvent;
	
	function getSelection () {
		if (window.getSelection) {
			return window.getSelection();
		} else if (document.selection && document.selection.createRange) {
			return document.selection.createRange();
		} else {
			return false;
		}
	}
	
	function getSelectedText (selection) {
		return selection.toString ? selection.toString() : selection.text;
	}
	
	function contains (a, b) {
		return a.contains ? a.contains(b) : !!(a.compareDocumentPosition(b) & 16);
	}
	
	function mouseOnMenu (e) {
		// Greife auf das Zielelement des Ereignisses zu
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
			span.unselectable = true;
			
			instance.setupMenuClick();
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
			});
			
			// Wenn in eine Auswahl geklickt wird, ist die Auswahl zum Zeitpunkt
			// des mouseup-Ereignis noch nicht aufgehoben. Daher prüfen wir
			// beim anschließenden click-Ereignis nach.
			addEvent(container, 'click', function (e) {
				var selection = getSelection();
				if (!selection) {
					return;
				}
				var selectedText = getSelectedText(selection);
				console.log('click', selectedText);
				if (!selectedText.length) {
					instance.hide(e);
				}
			});
		},
		
		setupMenuClick : function () {
			var instance = this;
			
			// Registiere Handlerfunktion für den Klick auf das Menü
			addEvent(span, 'click', function (e) {
				instance.handler.call(instance, e);
				return false;
			});
		},
		
		hide : function (e) {
			// Breche ab, wenn Event-Objekt übergeben wurde und das Mausereignis beim Menü passierte
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
		
		insert : function (e) {
			var instance = this;
			
			// Breche ab, wenn das Mausereignis beim Menü passierte
			if (mouseOnMenu(e)) {
				return;
			}
			
			// Hole Selection bzw. TextRange (IE)
			var selection = getSelection();
			if (!selection) {
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
			
			if (selection.getRangeAt) {
				// Hole Range, die zur Selection gehört
				var range = selection.getRangeAt(0);
				
				// Erzeuge neue (leere) Range
				var newRange = document.createRange();
				// Verschiebe Anfang der neuen Range an das Ende der Auswahl
				var order = selection.anchorNode.compareDocumentPosition(selection.focusNode);
				if (order & 2) {
					newRange.setStart(selection.anchorNode, range.endOffset);
				} else {
					newRange.setStart(selection.focusNode, range.endOffset);
				}
				
				// Befülle Menü-Span
				span.innerHTML = instance.menuHTML;
				newRange.insertNode(span);
				
			} else if (selection.duplicate) {
				// Kopiere TextRange
				var newRange = selection.duplicate();
				// Verschiebe Ende der neuen Range an das Ende der Auswahl
				newRange.setEndPoint('StartToEnd', selection);
				
				// Befülle Menü-Span
				span.innerHTML = instance.menuHTML;
				newRange.pasteHTML(span.outerHTML);
				
				// Da das Befüllen nicht über das DOM, sondern über serialisierten HTML-Code erfolgt,
				// stellen wir die Referenz wieder her sowie den Event-Handler
				span = document.getElementById(id);
				instance.setupMenuClick();
				
			} else {
				return;
			}
			
			instance.position();
		},
		
		position : function () {
			span.style.marginTop = -(span.offsetHeight + 5) + 'px';
		}
	};
	
	return SelectionMenu;
})();