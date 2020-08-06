import React from 'react';
import Header from '../header/Header';
import {
    createMuiTheme,
    ThemeProvider,
} from '@material-ui/core';
// @ts-ignore
import styles from './Layout.module.scss';
// @ts-ignore
import variables from '../../styles/variables.scss';

type TProps = {
    children: React.ReactNode;
}

const theme = createMuiTheme({
    palette: {
        primary: {
            main: variables.primary,
            light: variables.primary,
            dark: variables.primary
        },
    },
});

export default function Layout(props: TProps) {
    return (
        <ThemeProvider theme={theme}>
            <div className={styles.Layout}>
                <Header />
                {props.children}
            </div>
        </ThemeProvider>

    )
}