/*
CopyLink 1.1
http://github.com/molily/selectionmenu
by molily (zapperlott@gmail.com, http://molily.de/)

EN: CopyLink automatically inserts a source reference when the user copies text from a page
DE: CopyLink fügt automatisch eine Quellenreferenz ein, wenn der Benutzer Text von einer Seite kopiert

EN: License: Public Domain
EN: You're allowed to copy, distribute and change the code without restrictions

DE: Lizenz: Public Domain
DE: Kopieren, Verteilen und Aendern ohne Einschraenkungen erlaubt
*/

// EN: Create a private scope using an anonymous function,
// EN: save the return value in a global variable.
// DE: Erzeuge einen privaten Scope durch eine anonyme Funktion,
// DE: speichere den Rückgabwert in einer globalen Variable
var CopyLink = (function (window, document) {
	
	// EN: The element which is inserted when copying
	// DE: Das Element, welche beim Kopieren eingefügt wird
	var span = null;
	
	// EN: Shared private helper functions
	// DE: Geteilte private Helferfunktionen
	
	function addEvent (obj, type, fn) {
		// EN: Feature dection DOM Events / Microsoft
		// DE: Fähigkeitenweiche DOM Events / Microsoft
		if (obj.addEventListener) {
			obj.addEventListener(type, fn, false);
		} else if (obj.attachEvent) {
			obj.attachEvent('on' + type, function () {
				return fn.call(obj, window.event);
			});
		}
	}
	
	// EN: Publish addEvent as a static method
	// EN: (attach it to the constructor object)
	// DE: Mache addEvent als statische Methode öffentlich
	// DE: (hefte die Methode an den Konstruktor, der zurückgegeben wird)
	CopyLink.addEvent = addEvent;
	
	function getSelection () {
		// EN: Feature dection HTML5 / Microsoft
		// DE: Fähigkeitenweiche HTML5 / Microsoft
		if (window.getSelection) {
			return window.getSelection();
		} else if (document.selection && document.selection.createRange) {
			return document.selection.createRange();
		} else {
			// EN: No browser support available for the required features
			// DE: Keine Browser-Unterstützung für die benötigten Features
			return false;
		}
	}
	
	function getSelectedText (selection) {
		// EN : Feature detection HTML5 / Microsoft
		// DE: Fähigkeitenweiche HTML5 / Microsoft
		return selection.toString ? selection.toString() : selection.text;
	}
	
	function removeSpan () {
		// EN: Is the element attached to the DOM tree?
		// DE: Ist das Element in den DOM-Baum gehängt?
		var parent = span.parentNode;
		if (parent) {
			// EN: Remove the element from DOM (the element object remains
			// EN: in memory and will be reused later)
			// DE: Entferne das element aus dem DOM-Baum (Element bleibt im Speicher erhalten
			// DE: und wird später wiederverwendet)
			parent.removeChild(span);
		}
	}
	
	// EN: Main constructor function
	// DE: Konstruktorfunktion
	function CopyLink (options) {
		var instance = this;
		
		// EN: Copy members from the options object to the instance
		// DE: Kopiere Einstellungen aus dem options-Objekt herüber zur Instanz
		instance.id = options.id || 'copylink';
		instance.minimalSelection = options.minimalSelection || 20;
		instance.container = options.container;
		instance.handler = options.handler || function () {
			return '<br>Source: ' + location.href;
		};
		
		// EN: Initialisation
		// DE: Initialisiere
		instance.create();
		instance.setupEvents();
	}
	
	CopyLink.prototype = {
		
		create : function () {
			var instance = this;
			
			// EN: Create the container for the inserted text if necessary
			// DE: Erzeuge den Container für den eingefügten Text, sofern noch nicht passiert
			if (span) {
				return;
			}
			span = document.createElement('span');
			span.id = instance.id;
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
			
			// EN: Get a Selection object or a TextRange (IE)
			// DE: Hole Selection bzw. TextRange (IE)
			var selection = getSelection();
			if (!selection) {
				// EN: No browser support available for the required features
				// DE: Keine Browser-Unterstützung für die benötigten Features
				return;
			}
			
			// EN: Get the selected text
			// DE: Hole markierten Text
			var selectedText = getSelectedText(selection);
			
			// EN: Abort if the selected text is too short
			// DE: Breche ab, wenn der markierte Text zu kurz ist
			if (selectedText.length < instance.minimalSelection) {
				return;
			}
			
			// EN : Feature detection DOM Range / Microsoft
			// DE: Fähigkeitenweiche DOM Range / Microsoft
			if (selection.getRangeAt) {
				
				// EN: W3C DOM Range approach
				// DE: Lösungsansatz mit W3C DOM Range
				
				// EN: Get the first Range of the current Selection
				// DE: Hole Range, die zur Selection gehört
				var range = selection.getRangeAt(0);
				
				// EN: Get the start and end nodes of the selection
				// DE: Hole Start- und Endknoten der Auswahl
				var startNode = range.startContainer;
				var endNode = range.endContainer;
				
				if (!(startNode && endNode && startNode.compareDocumentPosition)) {
					// EN: Abort if we got bogus values or we can't compare their document position
					// DE: Breche ab, wenn die Knoten nicht brauchbar sind 
					return;
				}
				
				// EN: If the start node succeeds the end node in the DOM tree, flip them
				// DE: Wenn von hinten nach vorne markiert wurde, drehe Start und Ende um
				if (startNode.compareDocumentPosition(endNode) & 2) {
					startNode = endNode;
					endNode = range.startContainer;
				}
				
				// EN: Get the start and end offset
				// DE: Hole Start- und End-Offset
				var startOffset = range.startOffset;
				var endOffset = range.endOffset;
				
				// EN: If the end node is an element, use its last text node as the end offset
				// DE: Falls der Endknoten ein Element ist, nehme das Ende des letzten Textknoten
				if (endNode.nodeType == 1) {
					endNode = endNode.lastChild;
					if (!endNode || endNode.nodeType != 3) {
						return;
					}
					endOffset = endNode.data.length;
				}
				
				// EN: Create a new empty Range
				// DE: Erzeuge neue, leere Range
				var newRange = document.createRange();
				
				// EN: Move the beginning of the new Range to the end of the selection
				// DE: Verschiebe Anfang der neuen Range an das Ende der Auswahl
				newRange.setStart(endNode, endOffset);
				
				// EN: Fill the span containing the source reference
				// DE: Befülle das span-Element mit der Quellenreferenz
				span.innerHTML = instance.handler.call(instance);
				
				// EN: Inject the span element into the new Range
				// DE: Füge das span-Element in die neue Range ein
				newRange.insertNode(span);
				
				// EN: Enlarge the Range forward to enclose the original Range
				// DE: Erweitere Range nach vorne, um die ursprüngliche einzuschließen
				
				// EN: Include the span into the selection
				// DE: Schließe span in die Auswahl ein
				range.setEndAfter(span);
				
				// EN: Now select the whole text in the new range.
				// EN: This text is copied to the clipboard.
				// DE: Markiere den Text der Range, damit dieser in
				// DE: die Zwischenablage kopiert wird
				selection.removeAllRanges();
				selection.addRange(range);
				
				window.setTimeout(function () {
					// EN: Remove the span from the selection
					// DE: Entferne span wieder aus der Auswahl
					range.setEndBefore(span);
					
					// EN: Restore the original range and its text selection
					// DE: Stelle die ursprüngliche Range und damit die ursprüngliche Textauswahl wieder her
					if (selection.removeRange) {
						selection.removeRange(range);
					} else {
						selection.removeAllRanges();
					}
					selection.addRange(range);
					
					// EN: Remove the span from the DOM tree
					// DE: Entferne span wieder aus dem DOM
					removeSpan();
				}, 0);
				
			} else if (selection.duplicate) {
				
				// EN: Microsoft TextRange approach
				// DE: Lösungsansatz mit Microsoft TextRanges
				
				// EN: Create a copy the the TextRange
				// DE: Kopiere TextRange
				var newRange = selection.duplicate();
				
				// EN: Move the start of the new range to the end of the selection
				// DE: Verschiebe den Anfang der neuen Range an das Ende der Auswahl
				newRange.setEndPoint('StartToEnd', selection);
				
				// EN: Fill the span containing the source reference
				// DE: Befülle das span-Element mit der Quellenreferenz
				span.innerHTML = instance.handler.call(instance);
				
				// EN: Insert the span into the new range
				// DE: Fülle die neue Range mit dem span
				newRange.pasteHTML(span.outerHTML);
				
				// EN: Add the new TextRange to the current selection
				// DE: Schließe eingefügte TextRange in die Auswahl ein
				selection.setEndPoint('EndToEnd', newRange);
				
				// EN: Select the text of the TextRange
				// EN: This text is copied to the clipboard.
				// DE: Markiere den Textinhalt der TextRange, damit dieser in
				// DE: die Zwischenablage kopiert wird
				selection.select();
				
				// EN: Since we're using outerHTML to insert the span element,
				// EN: we have to restore the span reference
				// DE: Da das Befüllen nicht über das DOM, sondern über serialisierten HTML-Code erfolgt,
				// DE: stelle die Referenz wieder her
				span = document.getElementById(id);
				
				// EN: Remove the span from the DOM tree
				// DE: Entferne span wieder aus dem DOM
				window.setTimeout(removeSpan, 0);
				
			}
			
			// EN: No browser support available for the required features
			// DE: Keine Browser-Unterstützung für die benötigten Features
			
		}
	};
	
	// EN: Return the constructor function
	// DE: Gib den Konstruktor zurück
	return CopyLink;
	
})(window, document);