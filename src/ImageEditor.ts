import {Vector} from "./euclidean/Vector";
import {ElementTransformer} from "./svg/ElementTransformer";
import {SvgGraphicElement} from "./svg/SvgGraphicElement";

export = class ImageEditor {
  private _canvas: SvgGraphicElement;
  private _transformer: ElementTransformer;

  constructor(svgId: string) {
    this._canvas = new SvgGraphicElement(
      document.querySelector(`#${svgId}`) as SVGSVGElement);

    const self = this;
    const nativeCanvas = this._canvas.nativeElement;
    this._canvas.nativeElement.addEventListener("mousedown", (event) => {
      if (event.target instanceof SVGGraphicsElement) {
        const target = self._getElementContainer(event.target);

        // removes the current transformer, if applicable
        if (self._transformer) {
          self._transformer.remove();
        }
        self._transformer = null;

        if (target) {
          self._transformer = new ElementTransformer(
            new SvgGraphicElement(target));
        }
      }
    });
  }

  public _getElementContainer(elem: SVGGraphicsElement): SVGGraphicsElement {
    let ret = null;

    if (elem instanceof SVGGraphicsElement) {
      const root = elem.ownerSVGElement;

      if (root) {
        ret = elem;
        if (elem.parentNode instanceof SVGGraphicsElement
          && elem.parentNode !== root) {
          ret = this._getElementContainer(elem.parentNode);
        }
      }
    }

    return ret;
  }
};
