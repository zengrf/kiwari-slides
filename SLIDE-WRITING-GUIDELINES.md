# Mathematical slides: writing discipline and hygiene

These guidelines distill Michael Ruofan Zeng’s revisions to *3264 and Algebraic Cobordism*. They apply to the argument, typography, computations, and authoring system together.

## 1. Write the mathematical story before filling slides

Privately write one sentence stating the central mathematical message of each slide. Read those sentences in order: they must form an argument, with each step answering a question raised by the preceding material. These sentences are planning notes, not slogans to paste onto the slides.

Start each enumerative application with a centered problem, then develop the parameter space, its ring, the classes of the conditions, their product, and the geometric justification that this product counts the desired objects. Introduce a failed argument when its failure explains the construction that follows. For Steiner’s problem, the naive 7776 calculation should lead to the double-line Veronese locus, then to the blowup.

Background slides should explain their own subject. Do not interrupt a formal group law definition with an application that has not yet been introduced. Motivate the axioms through an earlier worked example, then give the background in its own logical order. A useful transition is a set of large property names with compact formulas in the theory currently under discussion.

## 2. Use mathematical titles, and repeat them

Name the object or statement: “Oriented cohomology ring of $\operatorname{Bl}_C\mathbb P^3$,” “Projective bundle formula,” or “Additive blowup formula.” Reuse the same title over successive slides on the same topic; put the changing step in a small label or the body.

Avoid promotional titles, invented summary names, and conclusions such as “The ring is explicit.” Divide the talk into mathematical sections, with section-title slides and a quiet navigation bar. End by returning to the title and a useful link or QR code.

## 3. Statements must be faithful and properly attributed

Use definition, theorem, proposition, and lemma environments. Retain the original numbering, hypotheses, terminology, and notation when quoting a paper; verify them against its source. Do not turn a cohesive talk into a succession of extracted statements.

Give prior results their original attribution in a parenthetical author–year citation. Do not attribute new results to a classical special case. Use checked bibliographic records and a proper BibTeX bibliography. Distinguish established results from an expected extension or an argument that should generalize.

Let the statement occupy the slide’s readable area. Do not repeat its conclusion in prose outside the same theorem environment. When a statement can fit on one slide, fit it there. Record any equivalent reformulation in the source documentation; do not call changed wording verbatim.

## 4. Introduce every symbol and keep conventions visible

A slide containing only an aligned display is rarely sufficient. Supply the notation and at least a short sentence identifying the purpose or meaning of the calculation. Speaker notes are not a substitute for visible definitions.

Use established notation directly. Avoid disposable aliases such as $Y=\operatorname{Bl}_V\mathbb P^5$ when the displayed geometry is clearer. Do not invent names such as “the conic blowup.” Keep projective-space letters blackboard bold and bundles calligraphic, including diagram labels.

Specify the coefficient ring and the theory being used. Keep a computation in general $A^\bullet$ when that is its scope, with coefficients $A^\bullet(\mathrm{pt})$; specialize to $\Omega^\bullet$ when the application calls for it. Do not silently replace a formal group law by its additive specialization.

Distinguish maps and hypotheses that are easy to conflate: pullbacks are ring homomorphisms, pushforwards are additive; a Thom isomorphism for an oriented theory is distinct from homotopy purity; a Gysin map need not be an equivalence. In a proof, say exactly what remains to be constructed and why it proves the claim.

## 5. Keep the computation in the argument

Keep essential calculations in the main sequence, not an appendix. Reduce the formula font carefully or use several consecutive slides when necessary. Concise text must not mean missing mathematics.

For a blowup presentation, organize the application in a reproducible order:

1. Identify the ambient space and center and give their cohomology rings.
2. Compute the normal bundle and required Chern classes.
3. Give the exceptional-divisor ring and its coefficient-module basis together; record needed powers and the formal inverse.
4. Compute pushforwards of classes from the center.
5. Display the particular blowup square, the rings at its corners, and the pullback and pushforward classes.
6. Introduce generators, then the four relation families individually: ambient intersection, mixed intersection, exceptional self-intersection, and excess intersection.
7. Evaluate excess intersection on the center’s basis, identify the point class and eliminate redundant generators, then display the complete ring presentation.
8. Identify the geometric incidence divisor, translate it using the formal group law, multiply the classes, and take the degree.

When a later example is requested to parallel an edited earlier example, compare the actual current slides one by one: title, emphasis, notation, formula used, conclusion, theorem treatment, diagram, and layout. Matching slide order alone is insufficient. Long relation formulas may be stated without derivations when requested, but they still need their governing formula and a sentence of context.

Write the entire quotient ring as one fraction, with its relations in the denominator. Avoid “modulo $I$, where $I$ is generated by…”. For a zero-dimensional enumerative product, express the result as $N[\mathrm{pt}]$ and take its degree by reading off $N$. Explain boundary avoidance and transversality when needed to justify the count.

## 6. Make geometry and diagrams do mathematical work

Use pictures to explain a degree, a tangency, an excess locus, or a parameter-space interpretation. Preserve the actual mathematical condition: tangency means intersection multiplicity at least two at a point, not necessarily two double intersections.

Keep Cartesian markers at the correct corner of the square. Label objects and arrows legibly. Put the exceptional basis at the exceptional-divisor corner, not at the blowup corner. Reuse a small instance of the relevant square on relation slides when it helps track the maps.

Animations must preserve the stated geometry at every frame. Moving tangent conics must remain tangent, and the contact points themselves must move. Different affine conic types are welcome when they arise from a valid family. Let the drawing use the available space.

## 7. Keep computation inspectable and honest

Show important Macaulay2 code, the actual raw input/output transcript, and a typeset result. Intermediate powers can reveal why coefficients disappear; retain separate controls for $T,T^2,T^3,T^4,T^5$ when that is the point of the demonstration.

Distinguish a displayed code excerpt from an executable script. A live demo should let the author edit the full program. Saved demos must identify recorded results, retain their source and provenance, and work without a running computation service. Do not dress up an expected answer as fresh execution.

For numerical plots, retain the full saved solution data and contact points, state numerical limitations accurately, and keep an efficient “show all” view. Bound drawing work and memory, cache the arrangement, and yield during long rendering so phones remain responsive.

## 8. Treat readability as part of correctness

Use a small amount of connective prose, clear highlighting, and enough space around it. Highlight answers, not every sentence. Large property names may have smaller, compact formulas underneath. Give blockquotes equal separation above and below. Avoid a wall of text and an unexplained wall of equations alike.

Render all LaTeX before judging fit. Inspect the slides at presentation size and on a small screen, including theorem boxes, long fractions, formal sums, diagrams, and references. Fix overflows and misplaced symbols rather than trusting source length.

## 9. Make every authored element editable

Every visible piece of authored text needs an editing path: titles, theorem labels, diagram paragraphs and arrow labels, captions, code headings, and expected results. Text hidden in a figure implementation still counts. Support Markdown and LaTeX, immediate preview, useful formatting help, and a clear save action.

Preserve the author’s current saved deck as authoritative. Do not rebuild it from an older draft or overwrite concurrent edits. Duplicated slides must not share mutable edit state. Verify that edits survive navigation, save/reload, export/import, and printing.

## 10. Separate authoring from publication

The working deck may contain an editor, presenter notes, timers, and live computations. The public audience deck should contain only the presentation and its relevant interactions: no editing controls, private notes, or dependence on a temporary host.

Pre-render mathematics and recorded computation results, package local fonts and assets, preserve licensing and attribution, and test the published artifact with live services unavailable. Verify links, section navigation, saved demos, page count, and QR destinations after deployment—not only in a local preview.

## Final review

Read the central-message sequence; check every symbol and theorem hypothesis; inspect each slide visually; run the displayed computations; test the audience interactions without a backend; and compare the release against the final edited source before publishing.
