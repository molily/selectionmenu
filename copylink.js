// Erzeuge einen privaten Scope durch eine anonyme Funktion,
// speichere den Rückgabwert in einer globalen Variable
var CopyLink = (function (window, document) {
	
	var span = null;
	var id = 'copylink';
	
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
	CopyLink.addEvent = addEvent;
	
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
	
	function removeSpan () {
		var parent = span.parentNode;
		if (parent) {
			// Entferne span aus dem DOM-Baum
			parent.removeChild(span);
		}
	}
	
	// Konstruktorfunktion
	function CopyLink (options) {
		var instance = this;
		
		// Kopiere Einstellungen aus dem options-Objekt herüber zur Instanz
		instance.minimalSelection = options.minimalSelection || 20;
		instance.container = options.container;
		instance.handler = options.handler || function () {
			return '<br>Source: ' + location.href;
		};
		
		// Initialisiere
		instance.create();
		instance.setupEvents();
	}
	
	CopyLink.prototype = {
		
		create : function () {
			var instance = this;
			
			// Erzeuge den Menü-Container, wenn noch nicht passiert
			if (span) {
				return;
			}
			
			span = document.createElement('span');
			span.id = id;
			span.style.cssText = 'position: absolute; left: -9999px;';
		},
		
		setupEvents : function () {
			var instance = this;
			addEvent(instance.container, 'copy', function () {
				instance.insert();
			});
		},
		
		insert : function () {
			var instance = this;
			
			// Hole Selection bzw. TextRange (IE)
			var selection = getSelection();
			if (!selection) {
				// Keine Browser-Unterstützung für die benötigten Features
				return;
			}
			
			// Hole markierten Text
			var selectedText = getSelectedText(selection);
			
			// Breche ab, wenn der markierte Text zu kurz ist
			if (selectedText.length < instance.minimalSelection) {
				return;
			}
			
			// Fähigkeitenweiche DOM Range / Microsoft
			if (selection.getRangeAt) {
				
				// Hole Range, die zur Selection gehört
				var range = selection.getRangeAt(0);
				
				// Erzeuge neue, leere Range
				var newRange = document.createRange();
				
				// Hole Start- und Endknoten der Auswahl
				var startNode = range.startContainer;
				var endNode = range.endContainer;
				
				if (!(startNode && endNode && startNode.compareDocumentPosition)) {
					return;
				}
				
				// Korrektur: Wenn von hinten nach vorne markiert wurde, drehe Start und Ende um
				if (startNode.compareDocumentPosition(endNode) & 2) {
					startNode = endNode;
					endNode = range.startContainer;
				}
				
				// Hole Start- und End-Offset
				var startOffset = range.startOffset;
				var endOffset = range.endOffset;
				
				// Korrektur: Falls der Endknoten ein Element ist, nehme das Ende des letzten Textknoten
				if (endNode.nodeType == 1) {
					var endNode = endNode.lastChild;
					if (!endNode || endNode.nodeType != 3) {
						return;
					}
					endOffset = endNode.data.length;
				}
				
				// Verschiebe Anfang der neuen Range an das Ende der Auswahl
				newRange.setStart(endNode, endOffset);
				
				// Befülle Menü-Span
				span.innerHTML = instance.handler();
				
				// Füge das span-Element in die neue Range ein
				newRange.insertNode(span);
				
				// Erweitere Range nach vorne, um die ursprüngliche einzuschließen
				
				// Schließe span in die Auswahl ein
				range.setEndAfter(span);
				
				// Selektiere Range
				selection.removeAllRanges();
				selection.addRange(range);
				
				window.setTimeout(function () {
					// Entferne span wieder aus der Auswahl
					range.setEndBefore(span);
					
					// Selektiere Range (stelle ursprüngliche Auswahl wieder her)
					selection.removeAllRanges();
					selection.addRange(range);
					
					// Entferne span wieder aus dem DOM
					removeSpan();
				}, 0);
				
			} else if (selection.duplicate) {
				
				// Kopiere TextRange
				var newRange = selection.duplicate();
				
				// Verschiebe Anfang der neuen Range an das Ende der Auswahl
				newRange.setEndPoint('StartToEnd', selection);
				
				// Befülle Menü-Span
				span.innerHTML = instance.handler();
				
				// Fülle die neue Range mit dem span
				newRange.pasteHTML(span.outerHTML);
				
				// Schließe eingefügte Range in die Auswahl ein
				selection.setEndPoint('EndToEnd', newRange);
				
				// Selektiere den Inhalt der Range
				selection.select();
				
				// Da das Befüllen nicht über das DOM, sondern über serialisierten HTML-Code erfolgt,
				// stelle die Referenz wieder her
				span = document.getElementById(id);
				
				// Entferne span wieder aus dem DOM
				window.setTimeout(removeSpan, 0);
				
			} else {
				// Keine Browser-Unterstützung für die benötigten Features
				return;
			}
			
		}
	};
	
	return CopyLink;
	
})(window, document);