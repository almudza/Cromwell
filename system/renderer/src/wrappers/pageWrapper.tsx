import {
    EDBEntity,
    getStoreItem,
    isServer,
    setStoreItem,
    TCromwellPage,
    TCromwellPageCoreProps,
    TDefaultPageName,
    TPageStats,
} from '@cromwell/core';
import { cleanParseContext, getModuleImporter, getParserTransform, getRestApiClient } from '@cromwell/core-frontend';
import { NextPage } from 'next';
import { NextRouter, withRouter } from 'next/router';
import React, { ReactNode, useRef } from 'react';
import ReactHtmlParser from 'react-html-parser';

import { CrwDocumentContext } from '../helpers/document';
import { useForceUpdate } from '../helpers/helpers';
import { usePatchForRedirects } from '../helpers/redirects';

type PageProps = Partial<TCromwellPageCoreProps> & {
    router?: NextRouter;
    children?: ReactNode;
}

const DefaultPageWrapperComp = ((props: any) => props.children ?? <></>);

export const withCromwellPage = (OriginalPage: { default: TCromwellPage }): NextPage & { originalPage?: NextPage } => {

    const pageComp = (props: PageProps): JSX.Element => {
        const { plugins, pageConfig, themeCustomConfig,
            cmsSettings, themeHeadHtml,
            themeFooterHtml, documentContext,
            palette, defaultPages, pageConfigName,
            resolvedPageRoute, slug } = props?.cmsProps ?? {};

        if (!isServer() && documentContext) {
            if (!documentContext.fullUrl)
                documentContext.fullUrl = window.location.href;

            if (!documentContext.origin)
                documentContext.origin = window.location.origin;

            if (documentContext.origin.endsWith('/'))
                documentContext.origin = documentContext.origin.slice(0, documentContext.origin.length - 1);
        }

        setStoreItem('routeInfo', {
            origin: documentContext?.origin,
            fullUrl: documentContext?.fullUrl,
        });

        const forcedChildStaticProps = useRef(null);
        if (cmsSettings) setStoreItem('cmsSettings', Object.assign({}, cmsSettings, getStoreItem('cmsSettings')));
        if (plugins) setStoreItem('plugins', plugins);
        if (pageConfig) setStoreItem('pageConfig', pageConfig);
        if (defaultPages) setStoreItem('defaultPages', defaultPages);
        if (themeCustomConfig) setStoreItem('themeCustomConfig', themeCustomConfig);
        if (palette) {
            const theme = getStoreItem('theme') ?? {};
            theme.palette = palette;
            setStoreItem('theme', theme);
        }

        const forceUpdate = useForceUpdate();
        const forceUpdatePage = (forcedProps?: any) => {
            forcedChildStaticProps.current = forcedProps;
            forceUpdate();
        }
        setStoreItem('forceUpdatePage', forceUpdatePage);

        usePatchForRedirects();

        let title;
        let description;
        let keywords;
        if (pageConfig) {
            if (pageConfig.title && pageConfig.title !== "") {
                title = pageConfig.title;
            }
            if (pageConfig.description && pageConfig.description !== "") {
                description = pageConfig.description;
            }
            if (pageConfig.keywords?.length) {
                keywords = pageConfig.keywords;
            }
        }

        if (!isServer()) {
            let pageDefaultName: TDefaultPageName | undefined;
            if (defaultPages) {
                Object.entries(defaultPages).forEach(entry => {
                    if (entry[1] === pageConfigName) pageDefaultName = entry[0] as TDefaultPageName;
                });
            }

            let entityType: EDBEntity = pageDefaultName as any;
            if (pageDefaultName === 'product') entityType = EDBEntity.Product;
            if (pageDefaultName === 'category') entityType = EDBEntity.ProductCategory;
            if (pageDefaultName === 'post') entityType = EDBEntity.Post;
            if (pageDefaultName === 'tag') entityType = EDBEntity.Tag;

            const apiClient = getRestApiClient();
            const pageStats: TPageStats = {
                pageRoute: window.location.pathname + window.location.search,
                pageName: pageConfigName,
                entityType,
                slug: Array.isArray(slug) ? JSON.stringify(slug) : slug,
            }
            apiClient?.post(`v1/cms/view-page`, pageStats, { disableLog: true }).catch(() => null);
        }

        const pageCompProps = forcedChildStaticProps.current ?? props;
        const Head = getModuleImporter()?.modules?.['next/head']?.default;
        const pageId = documentContext?.fullUrl ?? resolvedPageRoute as string;
        const parserTransformHead = getParserTransform(pageId);
        const parserTransformBody = getParserTransform(pageId, { executeScripts: true });

        let favicon = cmsSettings?.favicon;
        if (favicon && favicon !== '') {
            if (!favicon.startsWith('http')) {
                if (!favicon.startsWith('/')) favicon = '/' + favicon;
                if (documentContext?.origin) {
                    favicon = documentContext.origin + favicon;
                }
            }
        }

        const PageWrapperComp: React.ComponentType = getStoreItem('rendererComponents')?.pageWrapper ?? DefaultPageWrapperComp;

        const content = (
            <>
                <Head>
                    {favicon && (
                        <link rel="shortcut icon"
                            type={favicon.endsWith('.png') ? 'image/png' : 'image/jpg'}
                            href={favicon}
                        />
                    )}
                </Head>
                <PageWrapperComp>
                    <OriginalPage.default {...pageCompProps} {...props} />
                    {cmsSettings?.footerHtml && ReactHtmlParser(cmsSettings.footerHtml, { transform: parserTransformBody })}
                    {themeFooterHtml && ReactHtmlParser(themeFooterHtml, { transform: parserTransformBody })}
                    {pageConfig?.footerHtml && ReactHtmlParser(pageConfig?.footerHtml, { transform: parserTransformBody })}
                </PageWrapperComp>
                <Head>
                    {themeHeadHtml && ReactHtmlParser(themeHeadHtml, { transform: parserTransformHead })}
                    {cmsSettings?.headHtml && ReactHtmlParser(cmsSettings.headHtml, { transform: parserTransformHead })}
                    {title && (
                        <>
                            <title>{title}</title>
                            <meta property="og:title" content={title} />
                        </>
                    )}
                    {description && (
                        <>
                            <meta name="description" content={description} />
                            <meta property="og:description" content={description} />
                        </>
                    )}
                    {keywords && (
                        <>
                            <meta name="keywords" content={keywords.join(',')} />
                        </>
                    )}
                    {pageConfig?.headHtml && ReactHtmlParser(pageConfig?.headHtml, { transform: parserTransformHead })}
                </Head>
            </>
        );
        cleanParseContext(pageId);
        return content;
    }

    const HocComp = withRouter<PageProps & { router: NextRouter }>(pageComp);

    const HocPage = (props: PageProps) => (<CrwDocumentContext.Consumer>
        {value => <HocComp {...props} cmsProps={{
            ...(props?.cmsProps ?? {}),
            documentContext: value,
        }} />}
    </CrwDocumentContext.Consumer>);

    HocPage.originalPage = OriginalPage.default;
    return HocPage;
}