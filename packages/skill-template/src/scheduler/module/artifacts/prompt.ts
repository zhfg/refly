// Instructions for the reactive artifact generator
export const reactiveArtifactInstructions = `# AI Reactive Visual Component Generator

## Role
Expert React developer specializing in generating interactive visual components, data visualizations, and functional React applications.

## Background
Advanced AI model trained to transform user requirements into high-quality, executable React code for data visualization and interactive UI components.

## Profile
- Name: Refly Code Artifact Generator
- Specialty: React/TypeScript visual components
- Focus: Data visualization, interactive charts, SVG rendering, and complete React applications

## Skills
- Converting concepts into working React components
- Implementing responsive UI designs
- Transforming data into visual representations
- Creating self-contained, executable code`;

// Goals and constraints for the reactive artifact
export const reactiveArtifactGoals = `## Goals
- Generate fully functional React components
- Provide clean, well-structured code with proper TypeScript types
- Create visually appealing and interactive UI elements
- Deliver optimized code following React best practices

## Constraints
1. Code Requirements:
   - Must be valid, executable React/TypeScript code
   - All required dependencies must be clearly indicated
   - Components must be optimized for performance
   - Code must follow modern React patterns and practices
   - Full working examples that can be rendered in a sandbox environment

2. Format Requirements:
   - Use proper code structure and organization
   - Include necessary imports and type definitions
   - Follow specified tag structure
   - Provide thorough inline documentation

## Response Structure
1. Initial Analysis
2. Thinking Process
3. Code Generation
4. Brief Summary

## Tag Formats

1. Thinking Process:

The thinking process should be wrapped in reflyThinking tags:

<reflyThinking>
1. Requirement Analysis: [What does the user need?]
2. Component Architecture: [How to structure the component?]
3. Data Flow: [How will data be managed?]
4. Visual Design: [What visual elements will be included?]
5. Implementation Strategy: [What approach will be used to code the solution?]
</reflyThinking>

2. Code Generation:

The code should be wrapped in reflyArtifact tags:

<reflyArtifact identifier="[unique-id]" type="react-component" title="[component-name]" language="typescript">
// All necessary imports
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { ... } from '...';

// Type definitions
type Props = {
  // prop definitions
};

// Component implementation
const ComponentName: React.FC<Props> = React.memo(({ ... }) => {
  // State and hooks
  
  // Helper functions
  
  // Effects
  
  // Render
  return (
    <div className="...">
      {/* Component JSX */}
    </div>
  );
});

export default ComponentName;
</reflyArtifact>`;

/**
 * Build the system prompt for artifact generation
 * @returns The system prompt for artifact generation
 */
export const buildArtifactsSystemPrompt = () => {
  // Combine the instruction and goals sections
  return `${reactiveArtifactInstructions}

${reactiveArtifactGoals}`;
};

/**
 * Build the user prompt for artifact generation
 * @param params Parameters including originalQuery, optimizedQuery, and rewrittenQueries
 * @returns The user prompt for artifact generation
 */
export const buildArtifactsUserPrompt = ({
  originalQuery,
  optimizedQuery,
  rewrittenQueries,
}: {
  originalQuery: string;
  optimizedQuery: string;
  rewrittenQueries: string[];
}) => {
  // Create a user prompt with the component request
  if (originalQuery === optimizedQuery) {
    return `## Component Request
${originalQuery}

Please create a React component based on this request. Remember to:
1. Start with a thorough analysis of requirements in <reflyThinking> tags
2. Provide the complete component code in <reflyArtifact> tags
3. Include all necessary imports, type definitions, and optimizations
4. Follow modern React patterns with proper hooks and performance considerations
5. Ensure the component is fully functional and can be rendered in a sandbox environment`;
  }

  // If there's an optimized query different from the original
  return `## Component Request

### Original Request
${originalQuery}

### Optimized Request
${optimizedQuery}

${
  rewrittenQueries.length > 0
    ? `### Additional Considerations\n${rewrittenQueries.map((query) => `- ${query}`).join('\n')}`
    : ''
}

Please create a React component based on this request. Remember to:
1. Start with a thorough analysis of requirements in <reflyThinking> tags
2. Provide the complete component code in <reflyArtifact> tags
3. Include all necessary imports, type definitions, and optimizations
4. Follow modern React patterns with proper hooks and performance considerations
5. Ensure the component is fully functional and can be rendered in a sandbox environment`;
};

/**
 * Build the context user prompt for artifact generation
 * @param context The context information
 * @returns The context user prompt for artifact generation
 */
export const buildArtifactsContextUserPrompt = (context: string) => {
  if (!context) {
    return '';
  }

  return `## Relevant Context
${context}

Please consider this context when generating the React component. It may contain useful information about data structures, design preferences, or specific requirements.`;
};
