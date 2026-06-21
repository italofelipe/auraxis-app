/**
 * Barrel do motor genérico de coach marks (tour guiado / spotlight).
 *
 * Exporta o componente de composição, o provider/hook de âncoras e os tipos
 * públicos. A geometria e o parser de texto seguem importáveis pelo caminho
 * direto quando só a lógica pura é necessária (ex.: testes).
 */
export { CoachMarks, type CoachMarksProps, type CoachMarkVisualStep } from "@/shared/coach-marks/coach-marks";
export {
  TourAnchorProvider,
  useTourAnchor,
  useTourAnchorContext,
  type TourAnchorBinding,
  type TourAnchorContextValue,
  type MeasurableHandle,
} from "@/shared/coach-marks/tour-anchor-context";
export {
  type CoachMarkStep,
  type CoachMarksState,
} from "@/shared/coach-marks/use-coach-marks";
export { type Rect } from "@/shared/coach-marks/coach-marks-geometry";
