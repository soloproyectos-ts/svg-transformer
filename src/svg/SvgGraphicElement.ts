import {Point} from "../euclidean/dim2/Point";
import {Transformation} from "../euclidean/dim2/Transformation";
import {Vector} from "../euclidean/dim2/Vector";
import {ITransformable} from "../euclidean/Transformation";
import {SvgElement} from "./SvgElement";

export class SvgGraphicElement
  extends SvgElement<SVGGraphicsElement>
  implements ITransformable {
  private _stopDraggingEventName: string;
  private _isDraggingInit: boolean = false;
  private _isDragging: boolean = false;
  private _eventListeners: Array<(ev: Event) => any> = [];

  constructor(
    target: string | SVGGraphicsElement,
    attributes: {[key: string]: any} = {}) {
    super(target, attributes);
  }

  public get boundingBox():
    {x: number, y: number, width: number, height: number} {
    const box = this.nativeElement.getBBox();

    return {x: box.x, y: box.y, width: box.width, height: box.height};
  }

  public onStartDragging(listener: (init: Point) => void): SvgGraphicElement {
    const self = this;

    if (!this._isDraggingInit) {
      this._initDragging();
    }

    this.nativeElement.addEventListener("mousedown", (event) => {
      const t = self._getClientTransformation();
      const p = new Vector(event.clientX, event.clientY).transform(t);

      listener.apply(self, [p]);
    });

    return this;
  }

  public onDragging(listener: (p: Point) => void): SvgGraphicElement {
    const self = this;
    const eventListener = (event: MouseEvent) => {
      if (self._isDragging) {
        const t = self._getClientTransformation();
        const p = new Vector(event.clientX, event.clientY).transform(t);

        listener.apply(self, [p]);
      }
    };

    if (!this._isDraggingInit) {
      this._initDragging();
    }

    document.addEventListener("mousemove", eventListener);
    this._eventListeners.push(eventListener);

    return this;
  }

  public onStopDragging(listener: (p: Point) => void): SvgGraphicElement {
    const self = this;

    if (!this._isDraggingInit) {
      this._initDragging();
    }

    this.nativeElement.addEventListener(
        self._stopDraggingEventName,
        (event: CustomEvent) => listener.apply(self, [event.detail]));

    return this;
  }

  get transformation(): Transformation {
    let ret = new Transformation();
    const t = this.nativeElement.transform.baseVal.consolidate();

    if (t !== undefined && t !== null) {
      const m = t.matrix;

      ret = Transformation.createFromValues(m.a, m.b, m.c, m.d, m.e, m.f);
    }

    return ret;
  }

  set transformation(value: Transformation) {
    if (value === undefined || value === null) {
      this.removeAttr("transform");
    } else {
      this.setAttr("transform", value.toString());
    }
  }

  public transform(t: Transformation): SvgGraphicElement {
    this.setAttr("transform", this.transformation.transform(t).toString());

    return this;
  }

  public remove(): void {
    const eventNames = ["mousemove", "mouseup", "mouseleave", "blur"];
    for (const eventName of eventNames) {
      for (const listener of this._eventListeners) {
        document.removeEventListener(eventName, listener);
      }
    }

    super.remove();
  }

  // Generates a random ID.
  //
  // Thanks to: https://stackoverflow.com/a/105074/1704895
  private _generateId(): string {
    const t = (repeat: number = 1) => {
      const ret = [];

      for (let i = 0; i < repeat; i++) {
        ret.push(Math
          .floor((1 + Math.random()) * 0x10000)
          .toString(16)
          .substring(1));
      }

      return ret.join("");
    };

    return t(2) + "_" + t() + "_" + t() + "_" + t() + "_" + t(3);
  }

  // Initializes the dragging
  private _initDragging(): void {
    const self = this;

    this._stopDraggingEventName = `stopdragging_${this._generateId()}`;

    this.nativeElement.addEventListener("mousedown", (event) => {
      self._isDragging = true;
    });

    for (const eventName of ["mouseup", "mouseleave", "blur"]) {
      const eventListener = (event: Event) => {
        if (self._isDragging) {
          const t = self._getClientTransformation();
          const p = event instanceof MouseEvent
            ? new Vector(event.clientX, event.clientY).transform(t)
            : null;

          self.nativeElement.dispatchEvent(
            new CustomEvent(self._stopDraggingEventName, {detail: p}));
        }

        self._isDragging = false;
      };

      document.addEventListener(eventName, eventListener);
      this._eventListeners.push(eventListener);
    }

    this._isDraggingInit = true;
  }

  private _getClientTransformation(): Transformation {
    const canvas = this.ownerElement;
    const ctm = canvas.nativeElement.getScreenCTM();

    return Transformation.createFromValues(
      ctm.a, ctm.b, ctm.c, ctm.d, ctm.e, ctm.f).inverse();
  }

  private _getTransformValues(): {
    a: number, b: number, c: number, d: number, e: number, f: number} {
    const t = this.transformation;
    const [v0, v1, v2] = t.vectors;
    const a = v0.coordinates[0];
    const b = v0.coordinates[1];
    const c = v1.coordinates[0];
    const d = v1.coordinates[1];
    const e = v2.coordinates[0];
    const f = v2.coordinates[1];

    return {a, b, c, d, e, f};
  }
}
