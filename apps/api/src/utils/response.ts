export const buildSuccessResponse = <T>(data: T) => {
  return {
    success: true,
    data,
  };
};
