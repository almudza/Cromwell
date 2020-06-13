import React from 'react';
import { CromwellPageType, CromwellBlock, Link } from '@cromwell/core';
import ProductShowcase from '../modules/ProductShowcase';

const Index: CromwellPageType = (props) => {
    console.log('IndexTemplate props', props);

    return (
        <div>IndexTemp
            
        HELLO WOORLD1
        <Link href='/pages/some_page'><a>SomePage</a></Link>
            <CromwellBlock id="1">
                <div>
                    <p>CromwellBlock 1</p>
                </div>
            </CromwellBlock>
            <div>
                <h2>Some subtitle</h2>
            </div>
            <CromwellBlock id="2">
                <div>
                    <p>CromwellBlock 2</p>
                </div>
            </CromwellBlock>
            <ProductShowcase />
        </div>
    );
}
export default Index;