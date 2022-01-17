import { TCromwellNotify, TOrder, TPaymentOption, TPaymentSession, TShippingOption, useCmsSettings } from '@cromwell/core';
import { getCStore, LoadBox, useCart } from '@cromwell/core-frontend';
import clsx from 'clsx';
import React, { useRef } from 'react';

import { NotifierActionOptions } from '../../helpers/notifier';
import { BaseButton, TBaseButton } from '../shared/Button';
import { BaseRadio, TBaseRadio } from '../shared/Radio';
import { TBaseTextField } from '../shared/TextField';
import { usuCheckoutActions } from './actions';
import {
  DefaultEmptyCartAlert,
  DefaultField,
  DefaultPlacedOrder,
  getDefaultCheckoutFields,
  TCheckoutFieldProps,
} from './Base';
import styles from './Checkout.module.scss';
import { Coupons } from './Coupons';

export { TCheckoutFieldProps } from './Base';

export const DefaultCheckoutFields = {
  customerName: 'customerName',
  customerPhone: 'customerPhone',
  customerEmail: 'customerEmail',
  customerComment: 'customerComment',
}

export type TCheckoutField = {
  key: keyof typeof DefaultCheckoutFields | string;
  label?: string;
  validate?: (value?: string | null) => { valid: boolean; message: string };
  required?: boolean;
  Component?: React.ComponentType<TCheckoutFieldProps>;
  meta?: boolean;
}

export type CheckoutProps = {
  /**
   * Orders fields to display. Key can be one of enum `EDefaultCheckoutFields` or any string. 
   * If key is not part of enum, then it will be treated as part 
   * of JSON `customerAddress`. If flag `meta` is provided then key will
   * be treated as part of `customMeta`.
   */
  fields?: TCheckoutField[];

  /**
   * Additional payment options
   */
  getPaymentOptions?: (session?: TPaymentSession | null) => Promise<TPaymentOption[]>;

  /**
   * Additional delivery options
   */
  getShippingOptions?: (session?: TPaymentSession | null) => Promise<TShippingOption[]>;

  classes?: Partial<Record<'root' | 'blockTitle' | 'delimiter' | 'detailsRow' | 'withoutDiscountText'
    | 'withoutDiscountValue' | 'detailsRowName' | 'detailsRowValue' | 'totalText' | 'totalValue'
    | 'Coupons' | 'couponList' | 'coupon' | 'couponActions' | 'placedOrder' | 'loadBoxCover'
    | 'actionsBlock' | 'placedOrderText', string>>;

  elements?: {
    Loadbox?: React.ComponentType;
    PlacedOrder?: React.ComponentType<{ order: TOrder; }>;
    EmptyCartAlert?: React.ComponentType;
    RadioGroup?: TBaseRadio;
    Button?: TBaseButton;
    ApplyCouponButton?: TBaseButton;
    AddCouponButton?: TBaseButton;
    RemoveCouponButton?: TBaseButton;
    CouponAppliedIcon?: React.ComponentType;
    CouponProblemIcon?: React.ComponentType;
    RemoveCouponIcon?: React.ComponentType;
    TextField?: TBaseTextField;
  }

  text?: {
    yourOrderPlaced?: string;
    shippingAddress?: string;
    shippingMethods?: string;
    coupons?: string;
    orderDetails?: string;
    cartWithoutDiscount?: string;
    cartTotal?: string;
    shipping?: string;
    total?: string;
    paymentMethods?: string;
    yourCartIsEmpty?: string;
    placeOrder?: string;
    pay?: string;
    fieldIsRequired?: string;
    invalidEmail?: string;
    standardShipping?: string;
    payLater?: string;
    addCoupon?: string;
    apply?: string;
    fillOrderInformation?: string;
    failedCreateOrder?: string;
    noPaymentsAvailable?: string;
    choosePaymentMethod?: string;
    somethingWrongWithPayment?: string;
  }
  /**
   * Notifier tool. Will show notifications when user adds a product to the cart or
   * wishlist. To disable pass an empty object
   */
  notifier?: TCromwellNotify<NotifierActionOptions>;
  /**
   * Notifier options
   */
  notifierOptions?: NotifierActionOptions;

  onGetOrderTotal?: (data: TPaymentSession | undefined) => void;
  onPlaceOrder?: (placedOrder: TOrder | undefined) => void;
  onPay?: (success: boolean) => void;
}

export function Checkout(props: CheckoutProps) {
  const { fields = getDefaultCheckoutFields(props), classes, text } = props;
  const { PlacedOrder = DefaultPlacedOrder, RadioGroup = BaseRadio,
    EmptyCartAlert = DefaultEmptyCartAlert, Button = BaseButton } = props.elements ?? {};
  const cstore = getCStore();

  const rootRef = useRef<HTMLDivElement | null>(null);
  const checkout = usuCheckoutActions({
    checkoutProps: props,
    rootRef
  });
  const cmsSettings = useCmsSettings();
  const cart = useCart();

  const { order, paymentSession, changeOrder, standardShipping, payLaterOption } = checkout;


  const shippingOptions: TShippingOption[] = [
    ...(checkout?.additionalShippingOptions ?? []),
    ...(typeof cmsSettings?.defaultShippingPrice === 'number' ? [
      standardShipping
    ] : [])
  ].filter(Boolean);

  const paymentOptions: TPaymentOption[] = [
    ...(checkout?.additionalPaymentOptions ?? []),
    ...(checkout.paymentSession?.paymentOptions ?? []),
    ...(!cmsSettings?.disablePayLater ? [
      payLaterOption,
    ] : []),
  ].filter(Boolean);

  const wrapContent = (content: JSX.Element) => {
    return (
      <div className={clsx(styles.Checkout, classes?.root)} ref={rootRef}>
        {content}
        {checkout.isLoading && (
          <div className={clsx(styles.loadBoxCover, classes?.loadBoxCover)}>
            <LoadBox />
          </div>
        )}
      </div>
    );
  }

  if (checkout.placedOrder) {
    return wrapContent(
      <PlacedOrder order={checkout.placedOrder}>
        <p className={clsx(styles.placedOrderText, classes?.placedOrderText)}
        >{text?.yourOrderPlaced ?? 'Your order has been placed! Order ID:'} {checkout.placedOrder?.id}</p>
      </PlacedOrder>
    );
  }

  if (!cart?.length) {
    return wrapContent(
      <EmptyCartAlert>{text?.yourCartIsEmpty ?? 'Your cart is empty'}</EmptyCartAlert>
    );
  }

  return wrapContent(
    <>
      <h2 className={clsx(styles.blockTitle, classes?.blockTitle)}>
        {text?.shippingAddress ?? 'Shipping Address'}</h2>
      {fields?.map(field => {
        const Component: React.ComponentType<TCheckoutFieldProps> = field.Component ?? DefaultField;
        const value = checkout.getFieldValue(field.key) ?? '';
        const validation = checkout.isFieldValid(field.key);

        return (
          <Component value={value}
            key={field.key}
            checkout={checkout}
            checkoutProps={props}
            label={field.label}
            onChange={(newValue) => {
              checkout.setFieldValue(field.key, newValue)
            }}
            error={checkout.canShowValidation && !validation.valid}
            helperText={(checkout.canShowValidation && !validation.valid) ? validation.message : undefined}
          />
        )
      })}
      <div className={clsx(styles.delimiter, classes?.delimiter)}></div>

      <h2 className={clsx(styles.blockTitle, classes?.blockTitle)}>
        {text?.shippingMethods ?? 'Shipping Methods'}</h2>
      <RadioGroup
        value={order.shippingMethod ?? ''}
        onChange={(e, value) => changeOrder('shippingMethod', value)}
        options={shippingOptions.map(option => ({
          value: option.key,
          label: option.label ?? `${option.name}: ${cstore
            .getPriceWithCurrency(option.price)}`,
        }))}
      />
      <div className={clsx(styles.delimiter, classes?.delimiter)}></div>

      <h2 className={clsx(styles.blockTitle, classes?.blockTitle)}>{text?.coupons ?? 'Coupons'}</h2>
      <Coupons
        checkout={checkout}
        checkoutProps={props}
      />
      <div className={clsx(styles.delimiter, classes?.delimiter)}></div>

      <h2 className={clsx(styles.blockTitle, classes?.blockTitle)}>
        {text?.orderDetails ?? 'Order details'}</h2>
      {!!(paymentSession?.cartTotalPrice && paymentSession?.cartOldTotalPrice &&
        paymentSession.cartTotalPrice !== paymentSession.cartOldTotalPrice) && (
          <div className={clsx(styles.detailsRow, classes?.detailsRow)}>
            <p className={clsx(styles.withoutDiscountText, classes?.withoutDiscountText)}>
              {text?.cartWithoutDiscount ?? 'Cart total without discount:'}</p>
            <p className={clsx(styles.withoutDiscountValue, classes?.withoutDiscountValue)} >
              {cstore.getPriceWithCurrency(paymentSession.cartOldTotalPrice)}</p>
          </div>
        )}
      <div className={clsx(styles.detailsRow, classes?.detailsRow)}>
        <p className={clsx(styles.detailsRowName, classes?.detailsRowName)}>
          {text?.cartTotal ?? 'Cart total:'}</p>
        <p className={clsx(styles.detailsRowValue, classes?.detailsRowValue)}>
          {cstore.getPriceWithCurrency(paymentSession?.cartTotalPrice)}</p>
      </div>
      <div className={clsx(styles.detailsRow, classes?.detailsRow)}>
        <p className={clsx(styles.detailsRowName, classes?.detailsRowName)}>
          {text?.shipping ?? 'Shipping:'}</p>
        <p className={clsx(styles.detailsRowValue, classes?.detailsRowValue)}>
          {cstore.getPriceWithCurrency(paymentSession?.shippingPrice)}</p>
      </div>
      <div className={clsx(styles.detailsRow, classes?.detailsRow)}>
        <p className={clsx(styles.totalText, classes?.totalText)}>{text?.total ?? 'Total:'}</p>
        <b className={clsx(styles.totalValue, classes?.totalValue)}>
          {cstore.getPriceWithCurrency(paymentSession?.orderTotalPrice)}</b>
      </div>
      <div className={clsx(styles.delimiter, classes?.delimiter)}
        style={{ borderColor: 'transparent' }}></div>

      <h2 className={clsx(styles.blockTitle, classes?.blockTitle)}>
        {text?.paymentMethods ?? 'Payment Methods'}</h2>
      <RadioGroup
        value={order.paymentMethod ?? ''}
        onChange={(e, value) => changeOrder('paymentMethod', value)}
        options={paymentOptions.map(option => ({
          value: option.key ?? option.name!,
          label: option.name ?? option.key!,
        }))}
      />

      <div className={clsx(styles.actionsBlock, classes?.actionsBlock)}>
        {order.paymentMethod === payLaterOption.key && (
          <Button variant="contained"
            color="primary"
            size="large"
            onClick={checkout.placeOrder}
            disabled={checkout.isLoading || checkout.isAwaitingPayment}
          >{text?.placeOrder ?? 'Place order'}</Button>
        )}
        {order.paymentMethod && order.paymentMethod !== payLaterOption.key && (
          <Button variant="contained"
            color="primary"
            size="large"
            onClick={checkout.pay}
            disabled={checkout.isLoading || checkout.isAwaitingPayment}
          >{text?.pay ?? 'Pay'}</Button>
        )}
      </div>
    </>
  );
}