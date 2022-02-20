export const PI_2 = Math.PI / 2;
export const PI_180 = Math.PI / 180;

/**
 * 2D Vector Class
 */

export class Vector {
  private _x: number;
  private _y: number;

  public constructor(x: number = 0, y: number = 0) {
    this._x = x;
    this._y = y;
  }

  public static create(x: number, y: number): Vector {
    return new Vector(x, y);
  }

  public static add(a: Vector, b: Vector): Vector {
    return new Vector(a.x + b.x, a.y + b.y);
  }

  public static subtract(a: Vector, b: Vector): Vector {
    return new Vector(a.x - b.x, a.y - b.y);
  }

  public static random(range: number): Vector {
    const v: Vector = new Vector();
    v.randomize(range);
    return v;
  }

  public static distanceSquared(a: Vector, b: Vector): number {
    var dx = a.x - b.x;
    var dy = a.y - b.y;
    return dx * dx + dy * dy;
  }

  public static distance(a: Vector, b: Vector): number {
    var dx = a.x - b.x;
    var dy = a.y - b.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  public get x(): number {
    return this._x;
  }

  public get y(): number {
    return this._y;
  }

  public set x(value) {
    this._x = value;
  }

  public set y(value) {
    this._y = value;
  }

  public get magnitudeSquared(): number {
    return this._x * this._x + this._y * this._y;
  }

  public get magnitude(): number {
    return Math.sqrt(this.magnitudeSquared);
  }

  public get angle(): number {
    return (Math.atan2(this._y, this._x) * 180) / Math.PI;
  }

  public clone(): Vector {
    return new Vector(this._x, this._y);
  }

  public add(v: Vector): void {
    this._x += v.x;
    this._y += v.y;
  }

  public subtract(v: Vector): void {
    this._x -= v.x;
    this._y -= v.y;
  }

  public multiply(value: number): void {
    this._x *= value;
    this._y *= value;
  }

  public divide(value: number): void {
    this._x /= value;
    this._y /= value;
  }

  public normalize(): void {
    var magnitude = this.magnitude;
    if (magnitude > 0) {
      this.divide(magnitude);
    }
  }

  public limit(treshold: number): void {
    if (this.magnitude > treshold) {
      this.normalize();
      this.multiply(treshold);
    }
  }

  public randomize(amount: number = 1): void {
    this._x = amount * 2 * (-0.5 + Math.random());
    this._y = amount * 2 * (-0.5 + Math.random());
  }

  public rotate(degrees: number): void {
    const magnitude = this.magnitude;
    const angle = (Math.atan2(this._x, this._y) * PI_2 + degrees) * PI_180;
    this._x = magnitude * Math.cos(angle);
    this._y = magnitude * Math.sin(angle);
  }

  public flip(): void {
    const temp = this._y;
    this._y = this._x;
    this._x = temp;
  }

  public invert(): void {
    this._x = -this._x;
    this._y = -this._y;
  }

  public toString(): string {
    return this._x + ', ' + this._y;
  }
}
