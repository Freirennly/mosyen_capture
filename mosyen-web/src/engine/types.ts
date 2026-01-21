export type Quaternion = [number, number, number, number];

export interface MotionData {
    s: Quaternion[]; 
    timestamp?: number;
}