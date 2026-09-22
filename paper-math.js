/* Source notation, shared by slides and geometric diagrams. */
window.PAPER_MACROS={"\\Spec": "\\operatorname{Spec}", "\\Bl": "Bl", "\\pt": "\\operatorname{pt}", "\\CH": "CH^\\bullet", "\\Mbar": "\\overline M", "\\PP": "\\mathbb{P}", "\\AA": "\\mathbb{A}", "\\ZZ": "\\mathbb{Z}", "\\EE": "\\mathbb{E}", "\\Sm": "\\mathsf{Sm}", "\\MS": "\\mathsf{MS}", "\\SH": "\\mathsf{SH}", "\\Mn": "\\overline{M}_{0,n}", "\\Kont": "\\overline{M}_{0,0}(\\mathbb P^2,2)", "\\E": "\\mathcal{E}", "\\N": "\\mathcal{N}", "\\T": "\\mathcal{T}", "\\Q": "\\mathcal{Q}", "\\L": "\\mathcal{L}", "\\M": "\\mathcal{M}", "\\F": "\\mathcal F", "\\G": "\\mathcal G", "\\O": "\\mathcal{O}", "\\cO": "\\mathcal{O}", "\\Fplus": "\\;+_F\\;", "\\Fminus": "\\;-_F\\;", "\\Fsum": "\\mathop{\\mathrlap{\\kern{0.65em}\\vcenter{\\scriptscriptstyle F}}\\vcenter{\\sum}}\\limits", "\\symtangent": "\\operatorname{Sym}^2(\\mathcal T_{\\mathbb P^2})", "\\pointring": "A^\\bullet(\\operatorname{pt})"};

window.paperMath = function(tex,displayMode=false) {
  // KaTeX's composite F-sum operator produces invalid nested MathML in some
  // browsers. Its HTML output retains the source glyph; keep a text alternative.
  const composite=tex.includes('\\Fsum');
  const html=katex.renderToString(tex.trim(),{displayMode,output:composite?'html':'htmlAndMathml',throwOnError:true,strict:'ignore',trust:false,macros:PAPER_MACROS});
  return composite?`<span role="img" aria-label="${String(tex).replace(/[&<>\"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]))}">${html}</span>`:html;
};
