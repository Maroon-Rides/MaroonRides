package com.maroonrides.maroonrides;

import android.database.Cursor;
import android.database.sqlite.SQLiteDatabase;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import java.io.File;

// for moving react natives sqlite db to capacitor layer
@CapacitorPlugin(name = "LegacyPrefs")
public class LegacyPrefsPlugin extends Plugin {

    private static final String DATABASE_NAME = "RKStorage";
    private static final String TABLE_NAME = "catalystLocalStorage";
    private static final String KEY_COLUMN = "key";
    private static final String VALUE_COLUMN = "value";

    @PluginMethod
    public void getLegacyPrefs(PluginCall call) {
        JSObject entries = new JSObject();
        JSObject result = new JSObject();
        result.put("available", false);

        File database = getContext().getDatabasePath(DATABASE_NAME);
        if (!database.exists()) {
            result.put("entries", entries);
            call.resolve(result);
            return;
        }

        SQLiteDatabase db = null;
        Cursor cursor = null;

        try {
            db = SQLiteDatabase.openDatabase(database.getPath(), null, SQLiteDatabase.OPEN_READONLY);
            cursor = db.query(TABLE_NAME, new String[] { KEY_COLUMN, VALUE_COLUMN }, null, null, null, null, null);

            while (cursor.moveToNext()) {
                String key = cursor.getString(0);
                String value = cursor.getString(1);
                if (key != null && value != null) {
                    entries.put(key, value);
                }
            }

            result.put("available", true);
        } catch (Exception e) {
            // oh well resave your prefs
            result.put("available", false);
        } finally {
            if (cursor != null) {
                cursor.close();
            }
            if (db != null) {
                db.close();
            }
        }

        result.put("entries", entries);
        call.resolve(result);
    }
}
