import React, { useState, useMemo } from 'react';
import type { FC } from 'react';

// =======================================================================
// src/types/job.ts
// This file defines the type for a single job object, ensuring type safety
// across the entire application.
// =======================================================================
export interface Job {
    id: number;
    jobName: string;
    positionName: string;
    functionalArea: string;
    functionalRole: string;
    skills: string[];
    avgExp: number; // in years
    avgWage: number; // per annum in LPA
    gender: 'Male' | 'Female' | 'Any';
    highestQualification: string;
    state: string;
    district: string;
    description: string;
    matchScore: number; // percentage
}
