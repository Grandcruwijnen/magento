define(
    [
        'mage/url',
        'uiComponent',
        'Magento_Checkout/js/model/quote',
        'Magento_Customer/js/model/customer',
        'jquery',
        'myparcelnl_options_template',
        'myparcelnl_options_css',
        'myparcelnl_lib_myparcel',
        'myparcelnl_lib_moment',
        'myparcelnl_lib_webcomponents'
    ],
    function(mageUrl, uiComponent, quote, customer, jQuery, optionsHtml, optionsCss) {
        'use strict';

        var  originalShippingRate, optionsContainer, isLoading, myparcel, delivery_options_input, myparcel_method_alias, myparcel_method_element, isLoadingAddress;

        return {
            loadOptions: loadOptions,
            showOptions: showOptions,
            hideOptions: hideOptions
        };

        function loadOptions() {
            if (typeof window.mypa === 'undefined') {
                window.mypa = {isLoading: false, fn: {}};
            }
            window.mypa.fn.hideOptions = hideOptions;

            if (window.mypa.isLoading === false) {
                jQuery('.table-checkout-shipping-method').hide();
                window.mypa.isLoading = true;
                isLoading = setTimeout(function(){
                    clearTimeout(isLoading);

                    jQuery.ajax({
                        url: mageUrl.build('rest/V1/delivery_settings/get'),
                        type: "GET",
                        dataType: 'json'
                    }).done(function (response) {
                        window.mypa.data = response[0].data;
                        init();
                        window.mypa.isLoading = false;
                    });

                }, 50);
            }
        }

        function init() {
            if ((myparcel_method_alias = window.mypa.data.general.parent_method) === null) {
                hideOptions();
                return void 0;
            }

            myparcel_method_element = "input[id^='s_method_" + myparcel_method_alias + "_']";

            checkAddress();
        }

        function checkAddress() {
            isLoadingAddress = setTimeout(function(){
                console.log('checkAddress');
                clearTimeout(isLoadingAddress);
                _setAddress();
                _hideRadios();
                _appendTemplate();
                _setParameters();

                if (myParcelOptionsActive() && _getHouseNumber() !== '') {
                    console.log('number:');
                    console.log(_getHouseNumber());
                    showOptions();
                } else {
                    jQuery(myparcel_method_element + ":first").parent().parent().show();
                    hideOptions();
                }
            }, 50);
        }

        function _setAddress() {
            if (customer.isLoggedIn()) {
                var street0 = quote.shippingAddress._latestValue.street[0];
                if (typeof street0 === 'undefined') street0 = '';
                var street1 = quote.shippingAddress._latestValue.street[1];
                if (typeof street1 === 'undefined') street1 = '';
                var street2 = quote.shippingAddress._latestValue.street[2];
                if (typeof street2 === 'undefined') street2 = '';
                var country = quote.shippingAddress._latestValue.countryId;
                if (typeof country === 'undefined') country = '';
                var postcode = quote.shippingAddress._latestValue.postcode;
                if (typeof postcode === 'undefined') postcode = '';
            } else {
                var street0 = jQuery("input[name='street[0]']").val();
                if (typeof street0 === 'undefined') street0 = '';
                var street1 = jQuery("input[name='street[1]']").val();
                if (typeof street1 === 'undefined') street1 = '';
                var street2 = jQuery("input[name='street[2]']").val();
                if (typeof street2 === 'undefined') street2 = '';
                var country = jQuery("select[name='country_id']").val();
                if (typeof country === 'undefined') country = '';
                var postcode = jQuery("input[name='postcode']").val();
                if (typeof postcode === 'undefined') postcode = '';
            }

            window.mypa.address = [];
            window.mypa.address.street0 = street0;
            window.mypa.address.street1 = street1;
            window.mypa.address.street2 = street2;
            window.mypa.address.cc = country;
            window.mypa.address.postcode = postcode;
        }

        function showOptions() {
            originalShippingRate.hide();
            optionsContainer.show();
        }

        function hideOptions() {
            optionsContainer.hide();
            jQuery(myparcel_method_element + ':first').parent().parent().show();
        }

        function _hideRadios() {
            jQuery(myparcel_method_element).parent().parent().hide();
            jQuery('.table-checkout-shipping-method').show();
        }

        function myParcelOptionsActive() {
            if (window.mypa.address.cc !== 'NL') {
                return false;
            }

            return true;
        }

        function _getFullStreet() {
           return (window.mypa.address.street0 + ' ' + window.mypa.address.street1 + ' ' + window.mypa.address.street2).trim();
        }

        function _getHouseNumber() {
            var fullStreet = _getFullStreet();
            var arr = fullStreet.match(/[^\d]+([0-9]{1,4})[^\d]*/);
            if (arr == null) {
                /* @todo if null split street with big regex */
                return '';
            }

            return arr[1];
        }

        function _observeFields() {
            delivery_options_input = jQuery("input[name='delivery_options']");

            jQuery("input[id^='s_method']").parent().on('change', function (event) {
                setTimeout(function(){
                    if (jQuery(myparcel_method_element + ':checked').length === 0) {
                        delivery_options_input.val('');
                        myparcel.optionsHaveBeenModified();
                    }
                }, 50);
            });

            jQuery("input[name^='street'],input[name='postcode']").on('change', function (event) {
                checkAddress();
            });

            delivery_options_input.on('change', function (event) {
                _checkShippingMethod();
            });
        }

        function _setParameters() {
            var data = window.mypa.data;
            window.mypa.settings = {
                deliverydays_window: 10,
                number: _getHouseNumber(),
                street: _getFullStreet(),
                postal_code: window.mypa.address.postcode,
                price: {
                    morning: data.morning.fee,
                    default: data.general.base_price,
                    night: data.evening.fee,
                    pickup: data.pickup.fee,
                    pickup_express: data.pickup_express.fee,
                    signed: data.delivery.signature_fee,
                    only_recipient: data.delivery.only_recipient_fee,
                    combi_options: data.delivery.signature_and_only_recipient_fee,
                    mailbox: data.mailbox.fee,
                    exclude_delivery_type: data.general.exclude_delivery_types
                },
                base_url: 'https://api.myparcel.nl/delivery_options',
                text:
                    {
                        signed: data.delivery.signature_title,
                        only_recipient: data.delivery.only_recipient_title
                    }
            };

            myparcel = new MyParcel();
            myparcel.updatePage();
        }

        function _appendTemplate() {
            if (jQuery('#myparcel_td').length === 0) {
                var data = window.mypa.data;
                var baseColor = data.general.color_base;
                var selectColor = data.general.color_select;
                optionsCss = optionsCss.replace(/_base_color_/g, baseColor).replace(/_select_color_/g, selectColor);
                optionsHtml = optionsHtml.replace('<css/>', optionsCss);

                console.log(myparcel_method_alias);
                originalShippingRate = jQuery("td[id^='label_carrier_" + myparcel_method_alias + "_']").parent();
                optionsContainer = originalShippingRate.parent().prepend('<tr><td colspan="4" id="myparcel_td" style="display:none;"></td></tr>').find('#myparcel_td');
                optionsContainer.html(optionsHtml);

                _observeFields();
            }
        }

        function _checkShippingMethod() {
            var inputValue, json, type;

            inputValue = delivery_options_input.val();
            if (inputValue === '') {
                return;
            }

            json = jQuery.parseJSON(inputValue);

            if (typeof json.time[0].price_comment !== 'undefined') {
                type = json.time[0].price_comment;
            } else {
                type = json.price_comment;
            }

            switch (type) {
                case "morning":
                    if (json.options.signature) {
                        _checkMethod('#s_method_' + myparcel_method_alias + '_morning_signature');
                    } else {
                        _checkMethod('#s_method_' + myparcel_method_alias + '_morning');
                    }
                    myparcel.showDays();
                    break;
                case "standard":
                    if (json.options.signature && json.options.only_recipient) {
                        _checkMethod('#s_method_' + myparcel_method_alias + '_signature_only_recip');
                    } else {
                        if (json.options.signature) {
                            _checkMethod('#s_method_' + myparcel_method_alias + '_signature');
                        } else if (json.options.only_recipient) {
                            _checkMethod('#s_method_' + myparcel_method_alias + '_only_recipient');
                        } else {
                            _checkMethod('#s_method_flatrate_flatrate');
                        }
                    }
                    myparcel.showDays();
                    break;
                case "night":
                    if (json.options.signature) {
                        _checkMethod('#s_method_' + myparcel_method_alias + '_evening_signature');
                    } else {
                        _checkMethod('#s_method_' + myparcel_method_alias + '_evening');
                    }
                    myparcel.showDays();
                    break;
                case "retail":
                    _checkMethod('#s_method_' + myparcel_method_alias + '_pickup');
                    myparcel.hideDays();
                    break;
                case "retailexpress":
                    _checkMethod('#s_method_' + myparcel_method_alias + '_pickup_express');
                    myparcel.hideDays();
                    break;
                case "mailbox":
                    _checkMethod('#s_method_' + myparcel_method_alias + '_mailbox');
                    myparcel.hideDays();
                    break;
            }
        }

        function _checkMethod(selector) {
            jQuery("input[id^='s_method']").prop("checked", false).change();
            jQuery(selector).prop("checked", true).change().trigger('click');
        }
    }
);