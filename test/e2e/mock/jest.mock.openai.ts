const mockOpenAIClient = {
  chat: {
    completions: {
      create: jest.fn().mockImplementation(() => ({
        choices: [{ message: { content: 'Đây là phản hồi giả lập.' } }],
      })),
    },
  },
};

const OpenAI = jest.fn(() => mockOpenAIClient);

export default OpenAI;
