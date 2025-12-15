import React from 'react';
import { ThemeProvider, createTheme } from '@mui/material/styles';

const theme = createTheme();

const CertificateThemeProvider = ({ children }) => {
  return (
    <ThemeProvider theme={theme}>
      {children}
    </ThemeProvider>
  );
};

export default CertificateThemeProvider;


