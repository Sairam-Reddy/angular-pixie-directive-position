/**
 * Particle Class
 */

import { Vector } from './vector.model';

export class Particle {
  private _id: string;
  private _group: string;
  private _position: Vector;
  private _velocity: Vector;
  private _size: number;
  private _life: number;
  private _behavior;

  public constructor(
    id: string = 'default',
    group: string = 'default',
    position: Vector = new Vector(),
    velocity: Vector = new Vector(),
    size: number = 1,
    life: number = 0,
    behavior = []
  ) {
    this._id = id;
    this._group = group;

    this._position = position;
    this._velocity = velocity;
    this._size = size;
    this._life = Math.round(life);

    this._behavior = behavior;
  }

  public get id(): string {
    return this._id;
  }

  public get group(): string {
    return this._group;
  }

  public get life(): number {
    return this._life;
  }

  public get size(): number {
    return this._size;
  }

  public set size(size) {
    this._size = size;
  }

  public get position(): Vector {
    return this._position;
  }

  public get velocity(): Vector {
    return this._velocity;
  }

  public update(stage) {
    this._life++;

    let i = 0;
    const l = this._behavior.length;

    for (; i < l; i++) {
      this._behavior[i].call(stage, this);
    }
  }

  public toString(): string {
    return (
      'Particle(' +
      this._id +
      ') ' +
      this._life +
      ' pos: ' +
      this._position +
      ' vec: ' +
      this._velocity
    );
  }
}
