package com.pixiestack.budgetpro;

import android.os.Bundle;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(NativeAppPlugin.class);
        super.onCreate(savedInstanceState);
    }
}
