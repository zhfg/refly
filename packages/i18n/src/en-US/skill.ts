const translations = {
  commonQnA: {
    name: 'Common Question Answering',
    placeholder: 'Ask AI a question, select canvas nodes to specify context...',
    steps: {
      analyzeContext: {
        name: 'Context Analysis',
      },
      answerQuestion: {
        name: 'Question Answering',
      },
    },
  },
  generateDoc: {
    name: 'Generate Document',
    placeholder: 'Let AI help you generate a document...',
    steps: {
      analyzeContext: {
        name: 'Context Analysis',
      },
      generateTitle: {
        name: 'Generate Title',
      },
      generateDocument: {
        name: 'Generate Document',
      },
    },
  },
  editDoc: {
    name: 'Edit Document',
    placeholder: 'Let AI help you edit the document...',
    steps: {},
  },
  rewriteDoc: {
    name: 'Rewrite Document',
    steps: {},
  },
  webSearch: {
    name: 'Web Search',
    placeholder: 'Search the web and get answers...',
    steps: {
      webSearch: {
        name: 'Web Search',
      },
      answerGeneration: {
        name: 'Answer Generation',
      },
    },
  },
  librarySearch: {
    name: 'Library Search',
    placeholder: 'Search the library and get answers...',
    steps: {
      librarySearch: {
        name: 'Library Search',
      },
      answerGeneration: {
        name: 'Answer Generation',
      },
    },
  },
  recommendQuestions: {
    name: 'Recommend Questions',
    placeholder: 'Let AI recommend questions for you...',
    steps: {
      recommendQuestions: {
        name: 'Generate Recommended Questions',
      },
    },
  },
};

export default translations;
